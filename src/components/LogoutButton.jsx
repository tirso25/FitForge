import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function LogoutButton({ className = '', style = {} }) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await apiFetch('/api/auth/signout', { method: 'POST' });
        } catch {
            // Aunque falle, limpiamos sesión en el cliente
        } finally {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('userData');
            navigate('/login', { replace: true });
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: loading ? '#7f1d1d' : '#ef4444',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                opacity: loading ? 0.7 : 1,
                ...style,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#dc2626'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#ef4444'; }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {loading ? 'hourglass_empty' : 'logout'}
            </span>
            {loading ? 'Cerrando...' : 'Cerrar sesión'}
        </button>
    );
}
