import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('loggedUser');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'token' || event.key === 'loggedUser') {
                window.location.reload();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('loggedUser', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);

        if (userData.role === 'ROLE_SUPER_ADMIN') {
            navigate('/admin');
        } else {
            navigate('/status');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedUser');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};