import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ChangePassword from "./components/ChangePassword.jsx";
import Login from './components/Login.jsx';
import SignIn from './components/SignIn.jsx';
import CheckCode from './components/CheckCode.jsx';
import CheckEmail from './components/CheckEmail.jsx';
import AI from "./components/Ai.jsx";
import Profile from './components/Profile.jsx';
import UserProfile from './components/UserProfile.jsx';
import NavBar from './components/NavBar.jsx';
import { apiFetch } from './utils/api';
import '../index.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    const checkAuth = async () => {
        try {
            const response = await apiFetch('/api/users/whoami');
            const authOk = response.ok;

            if (authOk) {
                const profileRes = await apiFetch('/api/users/profile');
                setIsProfileComplete(profileRes.ok);
            }

            setIsAuthenticated(authOk);
        } catch (error) {
            console.error('Error verifying session:', error);
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    // Pantalla de carga mientras se verifica la sesión
    const loading = <div style={{ background: '#1e293b', height: '100vh' }} />;

    // Ruta protegida: requiere autenticación y perfil completo
    // Si no autenticado → /login
    // Si autenticado pero sin perfil → /profile
    // Si todo ok → renderiza el componente
    const ProtectedRoute = ({ children }) => {
        if (isAuthenticated === null) return loading;
        if (!isAuthenticated) return <Navigate to="/login" replace />;
        if (!isProfileComplete) return <Navigate to="/profile" replace />;
        return children;
    };

    // Ruta del perfil: requiere autenticación pero bloquea acceso si el perfil ya está completo
    // Si no autenticado → /login
    // Si ya tiene perfil completo → /ai (no puede volver a rellenar)
    // Si no tiene perfil → renderiza el formulario de perfil
    const ProfileRoute = () => {
        if (isAuthenticated === null) return loading;
        if (!isAuthenticated) return <Navigate to="/login" replace />;
        if (isProfileComplete) return <Navigate to="/ai" replace />;
        return <Profile onProfileUpdate={() => setIsProfileComplete(true)} />;
    };

    return (
        <Router>
            {isAuthenticated && isProfileComplete && <NavBar onLogout={() => { setIsAuthenticated(false); setIsProfileComplete(false); }} />}
            <main>
                <Routes>
                    {/* Rutas públicas del flujo de registro/verificación */}

                    <Route path="/changePassword" element={<ChangePassword />} />
                    <Route path="/signIn" element={<SignIn />} />
                    <Route path="/checkCode" element={<CheckCode />} />
                    <Route path="/checkEmail" element={<CheckEmail />} />

                    {/* Login: si ya está autenticado redirige directamente al destino correcto */}
                    <Route path="/login" element={
                        isAuthenticated === null
                            ? loading
                            : isAuthenticated
                                ? <Navigate to={isProfileComplete ? "/ai" : "/profile"} replace />
                                : <Login onLoginSuccess={checkAuth} />
                    } />

                    {/* Rutas protegidas: requieren auth + perfil completo */}
                    <Route path="/ai" element={
                        <ProtectedRoute><AI /></ProtectedRoute>
                    } />
                    <Route path="/user-profile" element={
                        <ProtectedRoute><UserProfile /></ProtectedRoute>
                    } />

                    {/* Ruta de perfil: solo accesible si no tienes perfil relleno */}
                    <Route path="/profile" element={<ProfileRoute />} />

                    {/* Ruta raíz y wildcard */}
                    <Route path="/" element={
                        isAuthenticated === null
                            ? loading
                            : <Navigate to={isAuthenticated ? (isProfileComplete ? "/ai" : "/profile") : "/login"} replace />
                    } />
                    <Route path="*" element={
                        isAuthenticated === null
                            ? loading
                            : <Navigate to={isAuthenticated ? (isProfileComplete ? "/ai" : "/profile") : "/login"} replace />
                    } />
                </Routes>
            </main>
        </Router>
    );
}

export default App;
