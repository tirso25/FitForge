import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import confetti from "canvas-confetti";
import { Notyf } from "notyf";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import useTTS from "../hooks/useTTS.js";
import { apiFetch } from '../utils/api.js';
import "notyf/notyf.min.css";
import 'animate.css';
import "../styles/general.css";
import "../styles/checkCode.css";
import "../styles/userProfile.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{};:,.<>])[A-Za-z\d@$!%*?&#^()_+=\-\[\]{};:,.<>]{8,128}$/;

export default function UserProfile() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const usernameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const weightRef = useRef(null);
    const heightRef = useRef(null);
    const ageRef = useRef(null);
    const genderRef = useRef(null);
    const sendButtonRef = useRef(null);

    const [allRight, setAllRight] = useState(true); // Defaults to true since data is pre-populated
    const [alreadyCelebrated, setAlreadyCelebrated] = useState(false);
    const [status, setStatus] = useState('loading');
    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isFetching = status === 'fetching';
    const isSaving = status === 'saving';

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [userData, setUserData] = useState({ username: '', email: '' });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (!sendButtonRef.current) return;

        if (allRight && (status === 'idle' || isSuccess)) {
            sendButtonRef.current.classList.add('bounce-animation');
            if (isSuccess && !alreadyCelebrated) {
                setAlreadyCelebrated(true);
                const rect = sendButtonRef.current.getBoundingClientRect();
                const x = (rect.left + rect.right) / 2 / window.innerWidth;
                const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
                confetti({ particleCount: 150, spread: 70, origin: { x, y } });
            }
        } else {
            sendButtonRef.current.classList.remove('bounce-animation');
            if (!allRight) setAlreadyCelebrated(false);
        }
    }, [allRight, status, alreadyCelebrated, isSuccess]);

    const fetchUserProfile = async () => {
        try {
            setStatus('fetching');
            const response = await apiFetch('/api/users/update');
            if (!response.ok) throw new Error('Failed to load profile');
            const data = await response.json();

            // Populate fields
            if (usernameRef.current) usernameRef.current.value = data.username || '';
            if (emailRef.current) emailRef.current.value = data.email || '';
            if (weightRef.current) weightRef.current.value = data.weight || '';
            if (heightRef.current) heightRef.current.value = data.height || '';
            if (ageRef.current) ageRef.current.value = data.age || '';
            if (genderRef.current) {
                const mapGender = { 'M': 'male', 'F': 'female' };
                genderRef.current.value = mapGender[data.gender] || data.gender || '';
            }

            setUserData({ username: data.username, email: data.email });
            setStatus('idle');
            validateInput();
        } catch (error) {
            console.error('Error fetching profile:', error);
            setStatus('error');
            const notyf = new Notyf();
            notyf.error({
                message: "Could not load profile data.",
                duration: 4000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });
        }
    };

    const LottieAnimation = () => (
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            maxWidth: '150px', maxHeight: '150px', overflow: 'hidden'
        }}>
            <DotLottieReact src="/animations/loading.lottie" loop autoplay style={{ width: '100%', height: '100%' }} />
        </div>
    );

    const validateInput = () => {
        if (!weightRef.current || !heightRef.current || !ageRef.current || !genderRef.current || !usernameRef.current) return;

        const weight = parseInt(weightRef.current.value);
        const height = parseInt(heightRef.current.value);
        const age = parseInt(ageRef.current.value);
        const gender = genderRef.current.value;
        const pwd = passwordRef.current?.value || '';
        const username = usernameRef.current.value.trim();

        const isWeightValid = !isNaN(weight) && weight >= 20 && weight <= 200;
        const isHeightValid = !isNaN(height) && height >= 50 && height <= 250;
        const isAgeValid = !isNaN(age) && age >= 1 && age <= 120;
        const isGenderValid = gender === 'male' || gender === 'female' || gender === 'other';
        const isUsernameValid = username.length >= 3;

        let isPwdValid = true;
        if (pwd.length > 0) {
            isPwdValid = passwordRegex.test(pwd);
        }

        const newAllRight = isWeightValid && isHeightValid && isAgeValid && isGenderValid && isUsernameValid && isPwdValid;
        setAllRight(newAllRight);
        updateButtonStyles(newAllRight);
    };

    const updateButtonStyles = (isValid) => {
        if (sendButtonRef.current && status !== 'saving') {
            sendButtonRef.current.disabled = !isValid;
            sendButtonRef.current.classList.toggle("enabled", isValid);
            sendButtonRef.current.style.backgroundColor = isValid ? "#2563eb" : "#ff3c00";
            sendButtonRef.current.style.cursor = isValid ? "pointer" : "not-allowed";
        }
    };

    const saveProfile = async () => {
        try {
            const genderMap = { male: 'M', female: 'F' };
            const payload = {
                username: usernameRef.current.value.trim(),
                weight: parseInt(weightRef.current.value),
                height: parseInt(heightRef.current.value),
                age: parseInt(ageRef.current.value),
                gender: genderMap[genderRef.current.value] ?? genderRef.current.value,
            };

            const pwd = passwordRef.current.value;
            if (pwd.length > 0) {
                payload.password = pwd;
            }

            setStatus('saving');

            const response = await apiFetch('/api/users/update', {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || "Failed to save profile");
            }

            setUserData(prev => ({ ...prev, username: payload.username }));
            if (passwordRef.current) passwordRef.current.value = '';

            setStatus('success');
            setAlreadyCelebrated(false);

            const notyf = new Notyf();
            notyf.success({
                message: 'Profile updated successfully!',
                duration: 3000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });

            setTimeout(() => setStatus('idle'), 2000);

        } catch (error) {
            console.error("Error:", error);
            setStatus('error');
            if (formRef.current) {
                formRef.current.classList.add('shake');
                setTimeout(() => formRef.current?.classList.remove('shake'), 400);
            }

            const notyf = new Notyf();
            notyf.error({
                message: error.message || "A network error has occurred.",
                duration: 4000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });

            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!allRight || status === 'saving') {
            setAlreadyCelebrated(false);
            formRef.current?.classList.add('shake');
            setTimeout(() => formRef.current?.classList.remove('shake'), 400);
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

        if (e.target.type === 'number' && e.target.value !== '') {
            const min = parseInt(e.target.min);
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val < min) {
                e.target.value = min;
            }
        }
        validateInput();
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    if (isFetching) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LottieAnimation /></div>;
    }

    return (
        <div className="user-profile-page">
            <fieldset id="checkCode" className="profile-card">

                {/* Profile Header based on User's Reference */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        <span className="material-symbols-outlined person-icon">person</span>
                    </div>
                    <div className="profile-info">
                        <h2>{userData.username || 'Loading...'}</h2>
                        <p>{userData.email || 'loading@email.com'}</p>
                    </div>
                </div>

                <form id="userProfileForm" ref={formRef} onSubmit={handleSubmit}>
                    <div id="content1" className="profile-form-grid">

                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                placeholder="Username"
                                minLength="3"
                                required
                                ref={usernameRef}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                onInput={validateInput}
                                autoComplete="username"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">Email account (Read Only)</label>
                            <input
                                type="email"
                                id="email"
                                disabled
                                ref={emailRef}
                                className="disabled-input"
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">New Password (Optional)</label>
                            <div className="input-container">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    id="password"
                                    placeholder="Leave blank to keep current"
                                    ref={passwordRef}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    onInput={validateInput}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={togglePasswordVisibility}
                                >
                                    <span className="material-symbols-outlined">
                                        {passwordVisible ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="stats-row">
                            <div className="input-group">
                                <label htmlFor="weight">Weight (kg)</label>
                                <input
                                    type="number"
                                    id="weight"
                                    min="20"
                                    max="200"
                                    required
                                    ref={weightRef}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    onInput={validateInput}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="height">Height (cm)</label>
                                <input
                                    type="number"
                                    id="height"
                                    min="50"
                                    max="250"
                                    required
                                    ref={heightRef}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    onInput={validateInput}
                                />
                            </div>
                        </div>

                        <div className="stats-row">
                            <div className="input-group">
                                <label htmlFor="age">Age</label>
                                <input
                                    type="number"
                                    id="age"
                                    min="1"
                                    max="120"
                                    required
                                    ref={ageRef}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    onInput={validateInput}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="gender">Gender</label>
                                <select
                                    id="gender"
                                    required
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
                        </div>

                    </div>
                    <div id="content2" style={{ marginTop: '20px' }}>
                        <button
                            type="submit"
                            className={`
                                send-btn 
                                ${allRight ? 'enabled' : ''} 
                                ${isSuccess ? 'btn-success' : ''} 
                                ${isError ? 'btn-error' : ''}
                                ${isSaving ? 'loading' : ''}
                            `}
                            disabled={!allRight || isSaving}
                            ref={sendButtonRef}
                            style={{
                                cursor: (!allRight || isSaving) ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                width: '100%'
                            }}
                        >
                            {isSaving ? <LottieAnimation /> : "Save Changes"}
                        </button>
                    </div>
                </form>
            </fieldset>
        </div>
    );
}
