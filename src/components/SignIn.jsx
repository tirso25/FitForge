import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import confetti from "canvas-confetti";
import { Notyf } from "notyf";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useGoogleLogin } from '@react-oauth/google';
import useTTS from "../hooks/useTTS.js";
import "notyf/notyf.min.css";
import 'animate.css';
import "../styles/general.css";
import "../styles/signIn.css";

const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*[a-zA-Z0-9]@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const usernameRegex = /^(?![._-])(?!.*[._-]{2})[a-z0-9._-]{5,20}(?<![._-])$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{};:,.<>])[A-Za-z\d@$!%*?&#^()_+=\-\[\]{};:,.<>]{8,128}$/;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function SignIn() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const emailRef = useRef(null);
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);
    const repeatPasswordRef = useRef(null);
    const signInButtonRef = useRef(null);
    const speakBtnRef = useRef(null);
    const rulesContainerRef = useRef(null);
    const googleButtonRef = useRef(null);

    const emailRuleRef = useRef(null);
    const usernameRuleRef = useRef(null);
    const pwdRuleRef = useRef(null);
    const repeatPwdRuleRef = useRef(null);
    const countRef = useRef(null);
    const count2Ref = useRef(null);

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [repeatPasswordVisible, setRepeatPasswordVisible] = useState(false);
    const [allRight, setAllRight] = useState(false);
    const [alreadyCelebrated, setAlreadyCelebrated] = useState(false);
    const [status, setStatus] = useState('idle');
    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    useTTS(speakBtnRef, rulesContainerRef);

    useEffect(() => {
        initializeCounterStyles();
        initializeButtonStyles();

        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);

        if (currentPath.includes('/auth/success')) {
            const email = urlParams.get('email');

            if (email) {
                showSuccessMessage("Authentication successful");

                setTimeout(() => {
                    navigate(`/changePassword?email=${encodeURIComponent(email)}`);
                }, 1700);
            }
        }

        if (currentPath.includes('/auth/error')) {
            const message = urlParams.get('message') || 'Authentication error';
            showErrorMessage(message);

            setTimeout(() => {
                window.location.href = './index.html';
            }, 3000);
        }
    }, []);

    useEffect(() => {
        if (!signInButtonRef.current) return;

        if (allRight && status === 'idle') {
            signInButtonRef.current.classList.add('bounce-animation');

            if (!alreadyCelebrated) {
                setAlreadyCelebrated(true);
                const rect = signInButtonRef.current.getBoundingClientRect();
                const x = (rect.left + rect.right) / 2 / window.innerWidth;
                const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
                confetti({ particleCount: 150, spread: 70, origin: { x, y } });
            }
        } else {
            signInButtonRef.current.classList.remove('bounce-animation');
            if (!allRight) {
                setAlreadyCelebrated(false);
            }
        }
    }, [allRight, status, alreadyCelebrated]);

    const initializeButtonStyles = () => {
        if (signInButtonRef.current) {
            signInButtonRef.current.disabled = true;
            signInButtonRef.current.style.backgroundColor = "#ff3c00";
            signInButtonRef.current.style.cursor = "not-allowed";
            signInButtonRef.current.classList.remove("enabled");
        }
    };

    const LottieAnimation = () => {
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <DotLottieReact
                    src="/animations/loading.lottie"
                    loop
                    autoplay
                    style={{
                        width: '80%',
                        height: '80%'
                    }}
                />
            </div>
        );
    };

    const checkPasswordRequirements = (password) => {
        return {
            requirements: {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                digit: /\d/.test(password),
                special: /[@$!%*?&#^()_+=\-\[\]{};:,.<>]/.test(password),
            },
            allValid: (
                password.length >= 8 &&
                /[A-Z]/.test(password) &&
                /[a-z]/.test(password) &&
                /\d/.test(password) &&
                /[@$!%*?&#^()_+=\-\[\]{};:,.<>]/.test(password)
            )
        };
    };

    const updatePasswordCounter = (password, counterRef) => {
        const counter = counterRef.current;
        if (!counter) return;

        const { requirements } = checkPasswordRequirements(password);

        counter.style.display = 'block';
        counter.style.opacity = '1';
        counter.style.transform = 'translateY(0)';

        const spans = counter.querySelectorAll('.counter-item');
        if (spans.length >= 5) {
            const charCount = password.length;
            const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
            const lowercaseCount = (password.match(/[a-z]/g) || []).length;
            const digitCount = (password.match(/\d/g) || []).length;
            const specialCount = (password.match(/[@$!%*?&#^()_+=\-\[\]{};:,.<>]/g) || []).length;

            spans[0].textContent = `Char: ${charCount}`;
            spans[1].textContent = `Upper: ${uppercaseCount}`;
            spans[2].textContent = `Lower: ${lowercaseCount}`;
            spans[3].textContent = `Digit: ${digitCount}`;
            spans[4].textContent = `Special: ${specialCount}`;

            spans[0].className = `counter-item ${requirements.length ? 'valid' : 'invalid'}`;
            spans[1].className = `counter-item ${requirements.uppercase ? 'valid' : 'invalid'}`;
            spans[2].className = `counter-item ${requirements.lowercase ? 'valid' : 'invalid'}`;
            spans[3].className = `counter-item ${requirements.digit ? 'valid' : 'invalid'}`;
            spans[4].className = `counter-item ${requirements.special ? 'valid' : 'invalid'}`;
        }

        if (password.length === 0) {
            hidePasswordCounter(counterRef);
        } else {
            counter.classList.add('custom-pulse-subtle');
            setTimeout(() => counter.classList.remove('custom-pulse-subtle'), 600);
        }
    };

    const togglePasswordCounter = (counterRef, isAllValid) => {
        const counter = counterRef.current;
        if (!counter) return;

        if (isAllValid) {
            hidePasswordCounter(counterRef);
        } else {
            counter.style.display = 'block';
            setTimeout(() => {
                counter.style.opacity = '1';
                counter.style.transform = 'translateY(0)';
            }, 10);
        }
    };

    const hidePasswordCounter = (counterRef) => {
        const counter = counterRef.current;
        if (!counter) return;

        counter.style.opacity = '0';
        counter.style.transform = 'translateY(-10px)';
        setTimeout(() => counter.style.display = 'none', 300);
    };

    const resetPasswordCounter = (counterRef) => {
        const counter = counterRef.current;
        if (!counter) return;

        counter.style.display = 'block';
        counter.style.opacity = '1';
        counter.style.transform = 'translateY(0)';

        const spans = counter.querySelectorAll('.counter-item');
        if (spans.length >= 5) {
            spans[0].textContent = 'Char: 0';
            spans[1].textContent = 'Upper: 0';
            spans[2].textContent = 'Lower: 0';
            spans[3].textContent = 'Digit: 0';
            spans[4].textContent = 'Special: 0';

            spans.forEach(span => span.className = 'counter-item');
        }
    };

    const initializeCounterStyles = () => {
        [countRef, count2Ref].forEach(ref => {
            const counter = ref.current;
            if (counter) {
                counter.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                counter.style.opacity = '0';
                counter.style.transform = 'translateY(-10px)';
                counter.style.display = 'none';
            }
        });
    };

    const applyValidationAnimation = (element, isValid) => {
        if (!element) return;

        element.classList.remove(
            "animate__animated",
            "animate__headShake",
            "custom-pulse",
            "custom-pulse-subtle",
            "custom-pulse-opacity"
        );

        void element.offsetWidth;

        element.style.color = isValid ? "green" : "#ff3c00";

        element.classList.add("animate__animated");
        element.classList.add(isValid ? "custom-pulse" : "animate__headShake");

        setTimeout(() => {
            element.classList.remove(
                "animate__animated",
                "animate__headShake",
                "custom-pulse"
            );
        }, 2000);
    };

    const validateInput = (event) => {
        const target = event.target;

        if (!emailRef.current || !usernameRef.current || !passwordRef.current || !repeatPasswordRef.current) {
            return;
        }

        const emailValue = emailRef.current.value.trim();
        const usernameValue = usernameRef.current.value.trim();
        const passwordValue = passwordRef.current.value.trim();
        const repeatPasswordValue = repeatPasswordRef.current.value.trim();

        const isEmailValid = emailRegex.test(emailValue);
        const isUsernameValid = usernameRegex.test(usernameValue);
        const isPasswordValid = passwordRegex.test(passwordValue);
        const isRepeatPasswordValid = passwordRegex.test(repeatPasswordValue) &&
            repeatPasswordValue === passwordValue;

        if (target === emailRef.current && emailRuleRef.current) {
            applyValidationAnimation(emailRuleRef.current, isEmailValid);
        }

        if (target === usernameRef.current && usernameRuleRef.current) {
            applyValidationAnimation(usernameRuleRef.current, isUsernameValid);
        }

        if (target === passwordRef.current && pwdRuleRef.current) {
            applyValidationAnimation(pwdRuleRef.current, isPasswordValid);

            if (repeatPwdRuleRef.current && repeatPasswordValue.length > 0) {
                const newRepeatValid = passwordRegex.test(repeatPasswordValue) &&
                    repeatPasswordValue === passwordValue;
                applyValidationAnimation(repeatPwdRuleRef.current, newRepeatValid);
            }
        }

        if (target === repeatPasswordRef.current && repeatPwdRuleRef.current) {
            applyValidationAnimation(repeatPwdRuleRef.current, isRepeatPasswordValid);
        }

        const newAllRight = isEmailValid && isUsernameValid && isPasswordValid && isRepeatPasswordValid;
        setAllRight(newAllRight);

        updateButtonStyles(newAllRight);
    };

    const validateData = (data) => {
        if (!data.email || !data.username || !data.password || !data.repeatPassword) {
            showErrorMessage('Invalid data');
            return false;
        }

        if (!emailRegex.test(data.email)) {
            showErrorMessage('Invalid email format');
            return false;
        }

        if (!usernameRegex.test(data.username)) {
            showErrorMessage('Invalid username format');
            return false;
        }

        if (data.password !== data.repeatPassword) {
            showErrorMessage('Passwords dont match');
            return false;
        }

        if (!passwordRegex.test(data.password) || !passwordRegex.test(data.repeatPassword)) {
            showErrorMessage('Invalid password format');
            return false;
        }

        return true;
    };

    const updateButtonStyles = (isValid) => {
        if (signInButtonRef.current && status !== 'loading') {
            signInButtonRef.current.disabled = !isValid;
            signInButtonRef.current.classList.toggle("enabled", isValid);
            signInButtonRef.current.style.backgroundColor = isValid ? "#2563eb" : "#ff3c00";
            signInButtonRef.current.style.cursor = isValid ? "pointer" : "not-allowed";
        }
    };



    const signin = async () => {
        try {
            const data = {
                email: emailRef.current.value,
                username: usernameRef.current.value,
                password: passwordRef.current.value,
                repeatPassword: repeatPasswordRef.current.value,
            };

            if (!validateData(data)) {
                return;
            }

            setStatus('loading');

            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data)
            });

            const message = await response.json();

            if (!response.ok) {
                if (formRef.current) {
                    formRef.current.classList.add('shake');
                    setTimeout(() => formRef.current?.classList.remove('shake'), 400);
                }
                setStatus('error');

                const notyf = new Notyf();
                notyf.error({
                    message: message.message,
                    duration: 4000,
                    dismissible: true,
                    position: { x: 'right', y: 'top' },
                });

                setTimeout(() => setStatus('idle'), 2000);
                return;
            }

            setStatus('success');
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

            const notyf = new Notyf();
            notyf.success({
                message: message.message,
                duration: 2000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });

            setTimeout(() => {
                navigate(`/checkCode?e=${encodeURIComponent(message.encryptedEmail)}`);
            }, 2000);
        } catch (error) {
            console.error("Error:", error);
            setStatus('error');

            const notyf = new Notyf();
            notyf.error({
                message: "A network error has occurred.",
                duration: 4000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });

            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!allRight || status === 'loading') {
            setAlreadyCelebrated(false);
            formRef.current.classList.add('shake');
            setTimeout(() => formRef.current.classList.remove('shake'), 400);
        } else {
            signin();
        }
    };

    const handleFocus = (e) => {
        e.target.style.border = '1px solid #5057d4';
        e.target.style.outline = 'none';
        e.target.style.boxShadow = '0 0 5px #5057d4';
    };

    const handleBlur = (e) => {
        e.target.style.border = "1px solid #3b4550";
        e.target.style.boxShadow = 'none';
    };

    const handleDblClick = (e) => {
        e.target.value = "";
        if (e.target === passwordRef.current) {
            resetPasswordCounter(countRef);
        } else if (e.target === repeatPasswordRef.current) {
            resetPasswordCounter(count2Ref);
        }
        validateInput(e);
    };

    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setPasswordVisible(!passwordVisible);
        } else if (field === 'repeatPassword') {
            setRepeatPasswordVisible(!repeatPasswordVisible);
        }
    };

    const handlePasswordFocus = (counterRef) => {
        togglePasswordCounter(counterRef, false);
    };

    const handlePasswordBlur = (counterRef) => {
        hidePasswordCounter(counterRef);
    };

    const handlePasswordKeyUp = (e, counterRef) => {
        updatePasswordCounter(e.target.value, counterRef);
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                if (googleButtonRef.current) {
                    googleButtonRef.current.disabled = true;
                    googleButtonRef.current.innerHTML = `<div class="loading-spinner"></div> Connecting...`;
                }

                setStatus('loading');
                const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        credential: tokenResponse.access_token,
                        rememberMe: false
                    })
                });

                const message = await response.json();

                if (!response.ok) {
                    setStatus('error');
                    if (googleButtonRef.current) {
                        googleButtonRef.current.disabled = false;
                        googleButtonRef.current.innerHTML = `
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" enable-background="new 0 0 48 48" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                            <span>Sign in with Google</span>
                        `;
                    }
                    const notyf = new Notyf();
                    notyf.error({
                        message: message.message || "Google Login failed",
                        duration: 4000,
                        dismissible: true,
                        position: { x: 'right', y: 'top' },
                    });
                    setTimeout(() => setStatus('idle'), 2000);
                    return;
                }

                setStatus('success');
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

                const notyf = new Notyf();
                notyf.success({
                    message: message.message,
                    duration: 2000,
                    dismissible: true,
                    position: { x: 'right', y: 'top' },
                });

                setTimeout(() => {
                    navigate('/AI');
                }, 1500);
            } catch (error) {
                console.error("Google Login Error:", error);
                setStatus('error');
                if (googleButtonRef.current) {
                    googleButtonRef.current.disabled = false;
                    googleButtonRef.current.innerHTML = `
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" enable-background="new 0 0 48 48" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                        <span>Sign in with Google</span>
                    `;
                }
                const notyf = new Notyf();
                notyf.error({
                    message: "A network error occurred.",
                    duration: 4000,
                    dismissible: true,
                    position: { x: 'right', y: 'top' },
                });
                setTimeout(() => setStatus('idle'), 2000);
            }
        },
        onError: () => {
            const notyf = new Notyf();
            notyf.error({ message: 'Google Sign-In failed', duration: 4000, position: { x: 'right', y: 'top' } });
        }
    });

    const handleGoogleAuthCallback = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const googleAuth = urlParams.get('google_auth');
        const token = urlParams.get('token');
        const message = urlParams.get('message');
        const rememberToken = urlParams.get('rememberToken');
        const user_id = urlParams.get('user_id');
        const username = urlParams.get('username');
        const email = urlParams.get('email');

        if (googleAuth === 'success' && token) {
            localStorage.setItem('jwt_token', token);

            if (rememberToken) {
                console.log('Remember me activated');
            }

            // Guardar datos del usuario si están disponibles
            if (user_id && username && email) {
                localStorage.setItem('userData', JSON.stringify({
                    this_user_id: user_id,
                    this_user_username: username,
                    this_user_email: email
                }));
            }

            const decodedMessage = message ? decodeURIComponent(message.replace(/\+/g, ' ')) : 'Login successful';
            showSuccessMessage(decodedMessage);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

            const url = new URL(window.location);
            url.searchParams.delete('google_auth');
            url.searchParams.delete('token');
            url.searchParams.delete('message');
            url.searchParams.delete('rememberToken');
            url.searchParams.delete('user_id');
            url.searchParams.delete('username');
            url.searchParams.delete('email');
            window.history.replaceState({}, document.title, url);

            setTimeout(() => {
                navigate('/AI');
            }, 1500);

        } else if (googleAuth === 'error') {
            const errorMessage = message ? decodeURIComponent(message.replace(/\+/g, ' ')) : 'Google authentication failed';
            showErrorMessage(errorMessage);

            if (googleButtonRef.current) {
                googleButtonRef.current.disabled = false;
                googleButtonRef.current.innerHTML = `
                <img src="/img/google-icon.svg" alt="Google" width="20" height="20">
                Sign in with Google
            `;
            }

            const url = new URL(window.location);
            url.searchParams.delete('google_auth');
            url.searchParams.delete('message');
            window.history.replaceState({}, document.title, url);
        }
    };

    useEffect(() => {
        console.log('SignIn component mounted, checking auth...');

        handleGoogleAuthCallback();
    }, []);

    const showSuccessMessage = (message) => {
        console.log('Success:', message);
        const notyf = new Notyf();
        notyf.success({
            message: message,
            duration: 2000,
            dismissible: true,
            position: { x: 'right', y: 'top' },
        });
    };

    const showErrorMessage = (message) => {
        console.error('Error:', message);
        const notyf = new Notyf();
        notyf.error({
            message: message,
            duration: 4000,
            dismissible: true,
            position: { x: 'right', y: 'top' },
        });
    };

    return (
        <>
            <fieldset id="rulesF">
                <div className="rules-container" ref={rulesContainerRef}>
                    <div id="rules">
                        <p id="email_rule" ref={emailRuleRef}>
                            <b>Email</b>: Valid format
                        </p>
                        <p id="usr_rule" ref={usernameRuleRef}>
                            <b>Username</b>: 5–20 characters (lowercase letters, numbers, dots, underscores or hyphens, no double symbols, must start/end with letter or number)
                        </p>
                        <p id="pwd_rule" ref={pwdRuleRef}>
                            <b>Password</b>: Min. 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol
                        </p>
                        <p id="repeatpwd_rule" ref={repeatPwdRuleRef}>
                            <b>Repeat password</b>: Must match
                        </p>
                    </div>
                    <button className="tts-btn" id="speakRulesBtn" ref={speakBtnRef}>
                        <span className="material-symbols-outlined">volume_up</span>
                    </button>
                </div>
            </fieldset>
            <br />
            <fieldset id="signIn">
                <form id="signInForm" ref={formRef} onSubmit={handleSubmit}>
                    <div id="content1">
                        <label htmlFor="signIn_email">Email</label>
                        <input
                            type="email"
                            id="signIn_email"
                            name="email"
                            placeholder="email@gmail.com"
                            required
                            minLength="5"
                            maxLength="255"
                            autoComplete="email"
                            ref={emailRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onInput={validateInput}
                            onDoubleClick={handleDblClick}
                        />

                        <label htmlFor="signIn_user_name">Username</label>
                        <input
                            type="text"
                            id="signIn_user_name"
                            name="username"
                            placeholder="username"
                            required
                            minLength="5"
                            maxLength="20"
                            autoComplete="username"
                            ref={usernameRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onInput={validateInput}
                            onDoubleClick={handleDblClick}
                        />

                        <label htmlFor="signIn_password">Password</label>
                        <div className="input-container">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                id="signIn_password"
                                name="password"
                                placeholder="Password (At least 8 characters)"
                                required
                                minLength="8"
                                maxLength="128"
                                autoComplete="new-password"
                                title="At least 8 characters, including uppercase, lowercase, number, and special character"
                                ref={passwordRef}
                                onFocus={(e) => {
                                    handleFocus(e);
                                    handlePasswordFocus(countRef);
                                }}
                                onBlur={(e) => {
                                    handleBlur(e);
                                    handlePasswordBlur(countRef);
                                }}
                                onInput={validateInput}
                                onKeyUp={(e) => handlePasswordKeyUp(e, countRef)}
                                onDoubleClick={handleDblClick}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => togglePasswordVisibility('password')}
                            >
                                <span className="material-symbols-outlined">
                                    {passwordVisible ? "visibility" : "visibility_off"}
                                </span>
                            </button>
                        </div>
                        <div id="count" className="password-counter" ref={countRef}>
                            <span className="counter-item">Char: 0</span>
                            <span className="counter-item">Upper: 0</span>
                            <span className="counter-item">Lower: 0</span>
                            <span className="counter-item">Digit: 0</span>
                            <span className="counter-item">Special: 0</span>
                        </div>

                        <label htmlFor="signIn_repeat_password">Repeat password</label>
                        <div className="input-container">
                            <input
                                type={repeatPasswordVisible ? "text" : "password"}
                                id="signIn_repeat_password"
                                name="repeat_password"
                                placeholder="Password (At least 8 characters)"
                                required
                                minLength="8"
                                maxLength="128"
                                autoComplete="new-password"
                                title="At least 8 characters, including uppercase, lowercase, number, and special character"
                                ref={repeatPasswordRef}
                                onFocus={(e) => {
                                    handleFocus(e);
                                    handlePasswordFocus(count2Ref);
                                }}
                                onBlur={(e) => {
                                    handleBlur(e);
                                    handlePasswordBlur(count2Ref);
                                }}
                                onInput={validateInput}
                                onKeyUp={(e) => handlePasswordKeyUp(e, count2Ref)}
                                onDoubleClick={handleDblClick}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => togglePasswordVisibility('repeatPassword')}
                            >
                                <span className="material-symbols-outlined">
                                    {repeatPasswordVisible ? "visibility" : "visibility_off"}
                                </span>
                            </button>
                        </div>
                        <div id="count2" className="password-counter" ref={count2Ref}>
                            <span className="counter-item">Char: 0</span>
                            <span className="counter-item">Upper: 0</span>
                            <span className="counter-item">Lower: 0</span>
                            <span className="counter-item">Digit: 0</span>
                            <span className="counter-item">Special: 0</span>
                        </div>
                    </div>
                    <div id="content2">
                        <a
                            href="/logIn"
                            className="button"
                            style={{ backgroundColor: "#2563eb" }}
                        >
                            Login
                        </a>
                        <button
                            type="submit"
                            className={`
                                signin-btn 
                                ${allRight ? 'enabled' : ''} 
                                ${isSuccess ? 'btn-success' : ''} 
                                ${isError ? 'btn-error' : ''}
                                ${isLoading ? 'loading' : ''}
                            `}
                            disabled={!allRight || isLoading}
                            id="registro"
                            ref={signInButtonRef}
                            style={{
                                cursor: (!allRight || isLoading) ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isLoading ? <LottieAnimation /> : "Sign In"}
                        </button>
                    </div>
                    <div className="google-login">
                        <button
                            type="button"
                            id="googleButton"
                            ref={googleButtonRef}
                            onClick={handleGoogleLogin}
                        >
                            <img
                                src="/img/google-icon.svg"
                                alt="Google icon"
                            />
                            Sign in with Google
                        </button>
                    </div>
                </form>
            </fieldset>
        </>
    );
}
