import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import confetti from "canvas-confetti";
import { Notyf } from "notyf";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import useTTS from "../hooks/useTTS.js";
import "notyf/notyf.min.css";
import 'animate.css';
import "../styles/general.css";
import "../styles/checkCode.css";

const API_BASE_URL = 'http://localhost:4000';

export default function Profile({ onProfileUpdate }) {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const weightRef = useRef(null);
    const heightRef = useRef(null);
    const ageRef = useRef(null);
    const genderRef = useRef(null);
    const weightRuleRef = useRef(null);
    const heightRuleRef = useRef(null);
    const ageRuleRef = useRef(null);
    const genderRuleRef = useRef(null);
    const sendButtonRef = useRef(null);
    const speakBtnRef = useRef(null);
    const rulesContainerRef = useRef(null);

    const [allRight, setAllRight] = useState(false);
    const [alreadyCelebrated, setAlreadyCelebrated] = useState(false);
    const [status, setStatus] = useState('idle');
    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    useTTS(speakBtnRef, rulesContainerRef);

    useEffect(() => {
        initializeButtonStyles();
    }, []);

    useEffect(() => {
        if (!sendButtonRef.current) return;

        if (allRight && status === 'idle') {
            sendButtonRef.current.classList.add('bounce-animation');

            if (!alreadyCelebrated) {
                setAlreadyCelebrated(true);
                const rect = sendButtonRef.current.getBoundingClientRect();
                const x = (rect.left + rect.right) / 2 / window.innerWidth;
                const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
                confetti({ particleCount: 150, spread: 70, origin: { x, y } });
            }
        } else {
            sendButtonRef.current.classList.remove('bounce-animation');
            if (!allRight) {
                setAlreadyCelebrated(false);
            }
        }
    }, [allRight, status, alreadyCelebrated]);

    const initializeButtonStyles = () => {
        if (sendButtonRef.current) {
            sendButtonRef.current.disabled = true;
            sendButtonRef.current.style.backgroundColor = "#ff3c00";
            sendButtonRef.current.style.cursor = "not-allowed";
            sendButtonRef.current.classList.remove("enabled");
        }
    };

    const LottieAnimation = () => (
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
                style={{ width: '80%', height: '80%' }}
            />
        </div>
    );

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
            element.classList.remove("animate__animated", "animate__headShake", "custom-pulse");
        }, 2000);
    };

    const validateInput = (event) => {
        const target = event.target;

        // Clampear al máximo en tiempo real para que no se pueda sobrepasar
        if (target.type === 'number' && target.value !== '') {
            const max = parseInt(target.max);
            const val = parseInt(target.value);
            if (!isNaN(val) && val > max) target.value = max;
        }

        const weight = parseInt(weightRef.current?.value);
        const height = parseInt(heightRef.current?.value);
        const age = parseInt(ageRef.current?.value);
        const gender = genderRef.current?.value;

        const isWeightValid = !isNaN(weight) && weight >= 20 && weight <= 200;
        const isHeightValid = !isNaN(height) && height >= 50 && height <= 250;
        const isAgeValid = !isNaN(age) && age >= 1 && age <= 120;
        const isGenderValid = gender === 'male' || gender === 'female' || gender === 'other';

        if (target === weightRef.current) applyValidationAnimation(weightRuleRef.current, isWeightValid);
        if (target === heightRef.current) applyValidationAnimation(heightRuleRef.current, isHeightValid);
        if (target === ageRef.current) applyValidationAnimation(ageRuleRef.current, isAgeValid);
        if (target === genderRef.current) applyValidationAnimation(genderRuleRef.current, isGenderValid);

        const newAllRight = isWeightValid && isHeightValid && isAgeValid && isGenderValid;
        setAllRight(newAllRight);
        updateButtonStyles(newAllRight);
    };

    const updateButtonStyles = (isValid) => {
        if (sendButtonRef.current && status !== 'loading') {
            sendButtonRef.current.disabled = !isValid;
            sendButtonRef.current.classList.toggle("enabled", isValid);
            sendButtonRef.current.style.backgroundColor = isValid ? "#2563eb" : "#ff3c00";
            sendButtonRef.current.style.cursor = isValid ? "pointer" : "not-allowed";
        }
    };

    const saveProfile = async () => {
        try {
            const genderMap = { male: 'M', female: 'F' };
            const data = {
                weight: weightRef.current.value.trim(),
                height: heightRef.current.value.trim(),
                age: ageRef.current.value.trim(),
                gender: genderMap[genderRef.current.value] ?? genderRef.current.value,
            };

            setStatus('loading');

            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                if (formRef.current) {
                    formRef.current.classList.add('shake');
                    setTimeout(() => formRef.current?.classList.remove('shake'), 400);
                }
                setStatus('error');

                const notyf = new Notyf();
                notyf.error({
                    message: result.error || result.message,
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
                message: 'Profile saved successfully!',
                duration: 2000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });

            setTimeout(() => {
                onProfileUpdate?.();
                navigate('/ai');
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
            saveProfile();
        }
    };

    const handleFocus = (e) => {
        e.target.style.border = "1px solid #5057d4";
        e.target.style.outline = "none";
        e.target.style.boxShadow = "0 0 5px #5057d4";
    };

    const handleBlur = (e) => {
        e.target.style.border = "1px solid #3b4550";
        e.target.style.boxShadow = "none";

        // Clampear al mínimo al salir del campo
        if (e.target.type === 'number' && e.target.value !== '') {
            const min = parseInt(e.target.min);
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val < min) {
                e.target.value = min;
                validateInput({ target: e.target });
            }
        }
    };

    const handleDblClick = (e) => {
        e.target.value = "";
        validateInput({ target: e.target });
    };

    return (
        <>
            <fieldset>
                <div className="rules-container" ref={rulesContainerRef}>
                    <div id="rules">
                        <p ref={weightRuleRef}>
                            <b>Weight</b>: Body weight in kilograms (20–200)
                        </p>
                        <p ref={heightRuleRef}>
                            <b>Height</b>: Total height in centimeters (50–250)
                        </p>
                        <p ref={ageRuleRef}>
                            <b>Age</b>: Current age (1–120)
                        </p>
                        <p ref={genderRuleRef}>
                            <b>Gender</b>: Biological gender
                        </p>
                    </div>
                    <button className="tts-btn" id="speakRulesBtn" ref={speakBtnRef}>
                        <span className="material-symbols-outlined">volume_up</span>
                    </button>
                </div>
            </fieldset>
            <br />
            <fieldset id="checkCode">
                <form id="checkCodeForm" ref={formRef} onSubmit={handleSubmit}>
                    <div id="content1">
                        <label htmlFor="weight">Weight (kg)</label>
                        <input
                            type="number"
                            id="weight"
                            placeholder="70"
                            min="20"
                            max="200"
                            step="1"
                            required
                            ref={weightRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onInput={validateInput}
                            onDoubleClick={handleDblClick}
                        />
                        <label htmlFor="height">Height (cm)</label>
                        <input
                            type="number"
                            id="height"
                            placeholder="170"
                            min="50"
                            max="250"
                            step="1"
                            required
                            ref={heightRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onInput={validateInput}
                            onDoubleClick={handleDblClick}
                        />
                        <label htmlFor="age">Age</label>
                        <input
                            type="number"
                            id="age"
                            placeholder="25"
                            min="1"
                            max="120"
                            required
                            ref={ageRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onInput={validateInput}
                            onDoubleClick={handleDblClick}
                        />
                        <label htmlFor="gender">Gender</label>
                        <select
                            id="gender"
                            required
                            defaultValue=""
                            ref={genderRef}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onChange={validateInput}
                        >
                            <option value="" disabled>Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div id="content2">
                        <button
                            type="submit"
                            className={`
                                send-btn
                                ${allRight ? 'enabled' : ''}
                                ${isSuccess ? 'btn-success' : ''}
                                ${isError ? 'btn-error' : ''}
                                ${isLoading ? 'loading' : ''}
                            `}
                            disabled={!allRight || isLoading}
                            ref={sendButtonRef}
                            style={{
                                cursor: (!allRight || isLoading) ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isLoading ? <LottieAnimation /> : "Save"}
                        </button>
                    </div>
                </form>
            </fieldset>
        </>
    );
}
