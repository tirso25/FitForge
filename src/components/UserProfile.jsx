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
    const pwdCounterRef = useRef(null);

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
    const [profileData, setProfileData] = useState(null);
    const [isDeletingAi, setIsDeletingAi] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Validate once the form mounts with profile data
    useEffect(() => {
        if (profileData && status === 'idle') {
            validateInput();
        }
    }, [profileData, status]);

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

            const mapGender = { 'M': 'male', 'F': 'female' };
            // Store data in state so inputs get values via defaultValue when they mount
            setProfileData({
                username: data.username || '',
                email: data.email || '',
                weight: data.weight || '',
                height: data.height || '',
                age: data.age || '',
                gender: mapGender[data.gender] || data.gender || '',
            });

            setUserData({ username: data.username, email: data.email });
            setStatus('idle');
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

    const checkPasswordRequirements = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            digit: /\d/.test(password),
            special: /[@$!%*?&#^()_+=\-\[\]{};:,.<>]/.test(password),
        };
    };

    const updatePasswordCounter = (password) => {
        const counter = pwdCounterRef.current;
        if (!counter) return;

        const reqs = checkPasswordRequirements(password);
        const spans = counter.querySelectorAll('.counter-item');
        if (spans.length < 5) return;

        const charCount = password.length;
        const upperCount = (password.match(/[A-Z]/g) || []).length;
        const lowerCount = (password.match(/[a-z]/g) || []).length;
        const digitCount = (password.match(/\d/g) || []).length;
        const specialCount = (password.match(/[@$!%*?&#^()_+=\-\[\]{};:,.<>]/g) || []).length;

        spans[0].textContent = `Char: ${charCount}`;
        spans[1].textContent = `Upper: ${upperCount}`;
        spans[2].textContent = `Lower: ${lowerCount}`;
        spans[3].textContent = `Digit: ${digitCount}`;
        spans[4].textContent = `Special: ${specialCount}`;

        spans[0].className = `counter-item ${reqs.length ? 'valid' : 'invalid'}`;
        spans[1].className = `counter-item ${reqs.uppercase ? 'valid' : 'invalid'}`;
        spans[2].className = `counter-item ${reqs.lowercase ? 'valid' : 'invalid'}`;
        spans[3].className = `counter-item ${reqs.digit ? 'valid' : 'invalid'}`;
        spans[4].className = `counter-item ${reqs.special ? 'valid' : 'invalid'}`;

        if (password.length === 0) {
            counter.style.opacity = '0';
            counter.style.display = 'none';
        } else {
            counter.style.display = 'block';
            counter.style.opacity = '1';
        }
    };

    const handlePasswordFocus = () => {
        const pwd = passwordRef.current?.value || '';
        if (pwd.length > 0 && pwdCounterRef.current) {
            pwdCounterRef.current.style.display = 'block';
            pwdCounterRef.current.style.opacity = '1';
        }
    };

    const handlePasswordBlur = () => {
        if (pwdCounterRef.current) {
            pwdCounterRef.current.style.opacity = '0';
            setTimeout(() => {
                if (pwdCounterRef.current) pwdCounterRef.current.style.display = 'none';
            }, 300);
        }
    };


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
                weight: weightRef.current.value.trim(),
                height: heightRef.current.value.trim(),
                age: ageRef.current.value.trim(),
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

    const handleDeleteAiHistory = async () => {
        const notyf = new Notyf();
        try {
            setIsDeletingAi(true);
            setShowDeleteConfirm(false);
            const response = await apiFetch('/api/users/ai-info', { method: 'DELETE' });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to delete AI history');
            }

            notyf.success({
                message: 'AI history deleted successfully!',
                duration: 3000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });
        } catch (error) {
            console.error('Error deleting AI history:', error);
            notyf.error({
                message: error.message || 'Could not delete AI history.',
                duration: 4000,
                dismissible: true,
                position: { x: 'right', y: 'top' },
            });
        } finally {
            setIsDeletingAi(false);
        }
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

                <form id="userProfileForm" key={profileData ? 'loaded' : 'empty'} ref={formRef} onSubmit={handleSubmit}>
                    <div id="content1" className="profile-form-grid">

                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                placeholder="Username"
                                minLength="3"
                                required
                                defaultValue={profileData?.username || ''}
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
                                defaultValue={profileData?.email || ''}
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
                                    onFocus={(e) => { handleFocus(e); handlePasswordFocus(); }}
                                    onBlur={(e) => { handleBlur(e); handlePasswordBlur(); }}
                                    onInput={validateInput}
                                    onKeyUp={(e) => updatePasswordCounter(e.target.value)}
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
                            <div className="password-counter" ref={pwdCounterRef} style={{ display: 'none', opacity: 0, transition: 'opacity 0.3s ease' }}>
                                <span className="counter-item">Char: 0</span>
                                <span className="counter-item">Upper: 0</span>
                                <span className="counter-item">Lower: 0</span>
                                <span className="counter-item">Digit: 0</span>
                                <span className="counter-item">Special: 0</span>
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
                                    defaultValue={profileData?.weight || ''}
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
                                    defaultValue={profileData?.height || ''}
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
                                    defaultValue={profileData?.age || ''}
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
                                    defaultValue={profileData?.gender || ''}
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

                <div className="danger-zone">
                    {!showDeleteConfirm ? (
                        <button
                            type="button"
                            className="delete-ai-btn"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeletingAi}
                        >
                            {isDeletingAi ? (
                                <LottieAnimation />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">delete_forever</span>
                                    Delete AI History
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="delete-confirm-panel">
                            <p className="delete-confirm-text">
                                <span className="material-symbols-outlined warning-icon">warning</span>
                                ¿Estás seguro? Esta acción eliminará todo tu historial de IA y no se puede deshacer.
                            </p>
                            <div className="delete-confirm-actions">
                                <button
                                    type="button"
                                    className="confirm-cancel-btn"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="confirm-delete-btn"
                                    onClick={handleDeleteAiHistory}
                                >
                                    <span className="material-symbols-outlined">delete_forever</span>
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </fieldset>
        </div>
    );
}
