import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Notyf } from "notyf";
import useTTS from "../hooks/useTTS.js";
import "notyf/notyf.min.css";
import 'animate.css';
import "../styles/general.css";
import "../styles/signIn.css";
import { apiFetch } from "../utils/api";

export default function Profile({ onProfileUpdate }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [profile, setProfile] = useState({
        weight: '',
        height: '',
        age: '',
        gender: ''
    });

    const speakBtnRef = useRef(null);
    const rulesContainerRef = useRef(null);

    // Custom labels for TTS
    const weightRuleRef = useRef(null);
    const heightRuleRef = useRef(null);
    const ageRuleRef = useRef(null);
    const genderRuleRef = useRef(null);

    const notyf = new Notyf({
        duration: 4000,
        dismissible: true,
        position: { x: 'right', y: 'top' },
    });

    useTTS(speakBtnRef, rulesContainerRef);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiFetch('/api/users/profile');
                if (response.ok) {
                    const data = await response.json();
                    setProfile({
                        weight: data.weight || '',
                        height: data.height || '',
                        age: data.age || '',
                        gender: data.gender || ''
                    });
                    setStatus('idle');
                } else if (response.status === 404) {
                    setStatus('idle');
                } else {
                    notyf.error('Error loading profile');
                    setStatus('error');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                notyf.error('Network error');
                setStatus('error');
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Prevent decimals: only allow digits
        if (value !== "" && !/^\d+$/.test(value)) {
            return;
        }

        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final integer check just in case
        if (!/^\d+$/.test(profile.weight) || !/^\d+$/.test(profile.height) || !/^\d+$/.test(profile.age)) {
            notyf.error('Decimals are not allowed. Please enter whole numbers.');
            return;
        }

        setStatus('saving');

        try {
            const response = await apiFetch('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                notyf.success('Profile updated successfully');
                if (onProfileUpdate) onProfileUpdate();
                setTimeout(() => navigate('/ai'), 1500);
            } else {
                const errorData = await response.json();
                notyf.error(errorData.error || 'Error updating profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            notyf.error('Network error while saving');
        } finally {
            setStatus('idle');
        }
    };

    if (status === 'loading') {
        return <div className="loading-container" style={{ background: '#1e293b', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>;
    }

    return (
        <div id="signIn" className="animate__animated animate__fadeIn">
            <fieldset>
                <div className="rules-container" ref={rulesContainerRef}>
                    <div id="rules">
                        <p id="email_rule" ref={weightRuleRef}>
                            <b>Weight</b>: Please enter your body weight in kilograms (whole numbers only).
                        </p>
                        <p id="username_rule" ref={heightRuleRef}>
                            <b>Height</b>: Please enter your total height in centimeters (whole numbers only).
                        </p>
                        <p id="pwd_rule" ref={ageRuleRef}>
                            <b>Age</b>: Provide your current age (minimum 13 years old recommended).
                        </p>
                        <p id="repeatpwd_rule" ref={genderRuleRef}>
                            <b>Gender</b>: Select your biological gender for more accurate health calculations.
                        </p>
                    </div>
                    <button className="tts-btn" id="speakRulesBtn" ref={speakBtnRef}>
                        <span className="material-symbols-outlined">volume_up</span>
                    </button>
                </div>
            </fieldset>
            <br />
            <fieldset>
                <form onSubmit={handleSubmit} id="logInForm">
                    <div id="content1">
                        <label htmlFor="weight">Weight (kg)</label>
                        <input
                            type="text"
                            id="weight"
                            name="weight"
                            placeholder="e.g. 75"
                            value={profile.weight}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="height">Height (cm)</label>
                        <input
                            type="text"
                            id="height"
                            name="height"
                            placeholder="e.g. 180"
                            value={profile.height}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="age">Age</label>
                        <input
                            type="text"
                            id="age"
                            name="age"
                            placeholder="e.g. 25"
                            value={profile.age}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="gender">Gender</label>
                        <select
                            id="gender"
                            name="gender"
                            value={profile.gender}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '15px',
                                border: '1px solid #3b4550',
                                borderRadius: '5px',
                                backgroundColor: '#1f2937',
                                color: '#f1f2e1',
                                fontSize: '14px'
                            }}
                        >
                            <option value="" disabled>Select gender</option>
                            <option value="m">Male</option>
                            <option value="f">Female</option>
                        </select>
                    </div>

                    <div id="content2" style={{ marginTop: '20px' }}>
                        <button
                            type="button"
                            className="button"
                            style={{ backgroundColor: '#2563eb' }}
                            onClick={() => navigate('/ai')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`button login-btn enabled ${status === 'saving' ? 'loading' : ''}`}
                            disabled={status === 'saving'}
                            style={{ backgroundColor: '#ff3c00' }}
                        >
                            {status === 'saving' ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </fieldset>
        </div>
    );
}
