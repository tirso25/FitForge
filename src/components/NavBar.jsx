import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../styles/navbar.css';

const GeminiIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 2C12 2 14.5 6.5 18 8.5C14.5 10.5 12 15 12 15C12 15 9.5 10.5 6 8.5C9.5 6.5 12 2 12 2Z"
            fill="currentColor"
            opacity="0.9"
        />
        <path
            d="M12 9C12 9 13.5 12.5 16 14C13.5 15.5 12 19 12 19C12 19 10.5 15.5 8 14C10.5 12.5 12 9 12 9Z"
            fill="currentColor"
            opacity="0.6"
        />
    </svg>
);

const WeightsIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="m826-585-56-56 30-31-128-128-31 30-57-57 30-31q23-23 57-22.5t57 23.5l129 129q23 23 23 56.5T857-615l-31 30ZM346-104q-23 23-56.5 23T233-104L104-233q-23-23-23-56.5t23-56.5l30-30 57 57-31 30 129 129 30-31 57 57-30 30Zm397-336 57-57-303-303-57 57 303 303ZM463-160l57-58-302-302-58 57 303 303Zm-6-234 110-109-64-64-109 110 63 63Zm63 290q-23 23-57 23t-57-23L104-406q-23-23-23-57t23-57l57-57q23-23 56.5-23t56.5 23l63 63 110-110-63-62q-23-23-23-57t23-57l57-57q23-23 56.5-23t56.5 23l303 303q23 23 23 56.5T857-441l-57 57q-23 23-57 23t-57-23l-62-63-110 110 63 63q23 23 23 56.5T577-161l-57 57Z" />
    </svg>
);

const navItems = [
    { id: 'home', icon: 'home', label: 'Home', path: '/' },
    { id: 'profile', icon: 'person', label: 'Profile', path: '/profile' },
    { id: 'ai', icon: 'gemini', label: 'AI Trainer', path: '/ai' },
    { id: 'calendar', icon: 'edit_calendar', label: 'Calendar', path: '/calendar' },
    { id: 'add', icon: 'add', label: 'Add exercise', path: '/add-exercise' },
    { id: 'routines', icon: 'weights', label: 'Routines', path: '/routines' },
    { id: 'map', icon: 'map', label: 'Map', path: '/map' },
    { id: 'alarm', icon: 'alarm', label: 'Timer', path: '/alarms' },
    { id: 'logout', icon: 'logout', label: 'Logout', path: null },
];

export default function NavBar({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await apiFetch('/api/auth/signout', { method: 'POST' });
        } catch {
            // Aunque falle, limpiamos sesión
        } finally {
            if (onLogout) onLogout();
            navigate('/login', { replace: true });
        }
    };

    const handleClick = (item) => {
        if (item.id === 'logout') {
            handleLogout();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const isActive = (item) => {
        if (!item.path) return false;
        if (item.path === '/') return location.pathname === '/';
        return location.pathname.startsWith(item.path);
    };

    return (
        <nav className="liquid-navbar">
            <div className="liquid-navbar-inner">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${isActive(item) ? 'active' : ''} ${item.id === 'logout' ? 'nav-logout' : ''}`}
                        onClick={() => handleClick(item)}
                        disabled={item.id === 'logout' && loggingOut}
                    >
                        {item.icon === 'gemini' ? (
                            <GeminiIcon size={22} />
                        ) : item.icon === 'weights' ? (
                            <WeightsIcon size={22} />
                        ) : (
                            <span className="material-symbols-outlined">{item.icon}</span>
                        )}
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
