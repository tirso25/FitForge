import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Notyf } from "notyf";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import useTTS from "../hooks/useTTS.js";
import "notyf/notyf.min.css";
import 'animate.css';
import "../styles/general.css";
import "../styles/login.css";

const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*[a-zA-Z0-9]@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function CheckEmail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'changePassword';

    const formRef = useRef(null);
    const emailRef = useRef(null);
    const submitButtonRef = useRef(null);
    const rulesContainerRef = useRef(null);
    const emailRuleRef = useRef(null);
    const speakBtnRef = useRef(null);

    const [allRight, setAllRight] = useState(false);
    const [status, setStatus] = useState('idle');
    const isLoading = status === 'loading';

    useTTS(speakBtnRef, rulesContainerRef);

    useEffect(() => {
        if (submitButtonRef.current) {
            submitButtonRef.current.disabled = true;
            submitButtonRef.current.style.backgroundColor = "#ff3c00";
            submitButtonRef.current.style.cursor = "not-allowed";
            submitButtonRef.current.classList.remove("enabled");
        }
    }, []);

    useEffect(() => {
        if (!submitButtonRef.current) return;
        if (allRight && status === 'idle') {
            submitButtonRef.current.disabled = false;
            submitButtonRef.current.style.backgroundColor = ""; // reset inline style
            submitButtonRef.current.classList.add('enabled');
            submitButtonRef.current.style.cursor = "pointer";
        } else {
            submitButtonRef.current.disabled = true;
            submitButtonRef.current.style.backgroundColor = "#ff3c00";
            submitButtonRef.current.style.cursor = "not-allowed";
            submitButtonRef.current.classList.remove('enabled');
        }
    }, [allRight, status]);

    const LottieAnimation = () => (
        <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none',
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <DotLottieReact src="/animations/loading.lottie" loop autoplay style={{ width: '80%', height: '80%' }} />
        </div>
    );

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
        validateInput(e);
    };

    const validateInput = (e) => {
        const value = e.target.value.trim();
        let isValid = emailRegex.test(value);

        if (emailRuleRef.current) {
            emailRuleRef.current.style.color = isValid ? "green" : "#ff3c00";
            emailRuleRef.current.classList.remove("animate__animated", "animate__headShake");
            void emailRuleRef.current.offsetWidth;
            emailRuleRef.current.classList.add("animate__animated", isValid ? "custom-pulse" : "animate__headShake");
        }

        setAllRight(isValid);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!allRight) return;

        setStatus('loading');
        const email = emailRef.current.value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/checkEmail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, type })
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus('error');
                const notyf = new Notyf();
                notyf.error({
                    message: data.message || "Email not found",
                    duration: 4000,
                    dismissible: true,
                    position: { x: 'right', y: 'top' },
                });
                setTimeout(() => setStatus('idle'), 2000);
                return;
            }

            if (data.status === 'pending') {
                setStatus('idle');
                const notyf = new Notyf();
                notyf.success({
                    message: "Account pending. Verification email sent.",
                    duration: 4000,
                    dismissible: true,
                    position: { x: 'right', y: 'top' },
                });
                setTimeout(() => navigate(`/checkCode?e=${encodeURIComponent(data.encryptedEmail)}`), 2000);
                return;
            }

            if (data.status === 'inactive') {
                setStatus('error');
                const notyf = new Notyf();
                notyf.error({
                    message: "Account deactivated. Contact support.",
                    duration: 4000,
                    dismissible: true,
                    position: { x: 'right', y: 'top' },
                });
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            setStatus('success');
            const notyf = new Notyf();
            notyf.success({
                message: "Email found successfully.",
                duration: 2000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });

            // Redirect conceptually - can be updated later if needed
            setTimeout(() => {
                navigate(`/changePassword?email=${encodeURIComponent(email)}`);
            }, 1500);

        } catch (error) {
            console.error("Verification Error:", error);
            setStatus('error');
            const notyf = new Notyf();
            notyf.error({
                message: "A network error occurred.",
                duration: 4000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <>
            <fieldset>
                <div className="rules-container" ref={rulesContainerRef}>
                    <div id="rules">
                        <p id="email_rule" ref={emailRuleRef}>
                            <b>Email</b>: Valid format
                        </p>
                    </div>
                    <button className="tts-btn" id="speakRulesBtn" ref={speakBtnRef}>
                        <span className="material-symbols-outlined">volume_up</span>
                    </button>
                </div>
            </fieldset>
            <br />
            <fieldset id="logIn">
                <form id="logInForm" ref={formRef} onSubmit={handleSubmit}>
                    <div id="content1">
                        <label htmlFor="check_email">Enter your Email</label>
                        <input
                            type="email"
                            id="check_email"
                            placeholder="email@gmail.com/es"
                            required
                            maxLength="255"
                            autoComplete="email"
                            ref={emailRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onDoubleClick={handleDblClick}
                            onInput={validateInput}
                        />
                    </div>
                    <div id="content2">
                        <button
                            type="button"
                            className="button"
                            style={{ backgroundColor: "#64748b" }}
                            onClick={() => navigate('/login')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`
                                login-btn 
                                ${allRight ? 'enabled' : ''} 
                                ${status === 'loading' ? 'loading' : ''}
                            `}
                            disabled={!allRight || isLoading}
                            id="inicio"
                            ref={submitButtonRef}
                            style={{
                                cursor: (!allRight || isLoading) ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isLoading ? <LottieAnimation /> : "Continue"}
                        </button>
                    </div>
                </form>
            </fieldset>
        </>
    );
}
