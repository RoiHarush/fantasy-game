import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem('loggedUser');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to parse stored user", e);
            sessionStorage.clear();
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (userData, token) => {
        sessionStorage.setItem('loggedUser', JSON.stringify(userData));
        sessionStorage.setItem('token', token);
        setUser(userData);

        if (userData.role === 'ROLE_SUPER_ADMIN') {
            navigate('/admin');
        } else {
            navigate('/status');
        }
    };

    const logout = () => {
        sessionStorage.clear();
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};