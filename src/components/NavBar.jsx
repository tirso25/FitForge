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

const navItems = [
    { id: 'home', icon: 'home', label: 'Inicio', path: '/' },
    { id: 'ai', icon: 'gemini', label: 'AI Trainer', path: '/ai' },
    { id: 'calendar', icon: 'edit_calendar', label: 'Calendario', path: '/calendar' },
    { id: 'add', icon: 'add', label: 'Añadir ejercicio', path: '/add-exercise' },
    { id: 'bookmarks', icon: 'bookmarks', label: 'Guardados', path: '/saved' },
    { id: 'map', icon: 'map', label: 'Mapa', path: '/map' },
    { id: 'alarm', icon: 'alarm', label: 'Recordatorios', path: '/alarms' },
    { id: 'logout', icon: 'logout', label: 'Cerrar sesión', path: null },
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
                        data-tooltip={item.label}
                    >
                        {item.icon === 'gemini' ? (
                            <GeminiIcon size={22} />
                        ) : (
                            <span className="material-symbols-outlined">{item.icon}</span>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
}
