"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
            router.replace('/admin');
        } else {
            router.replace('/status');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedUser');
        setUser(null);
        router.replace('/login');
    };

    const updateUser = useCallback((updates) => {
        setUser((currentUser) => {
            if (!currentUser) return currentUser;
            const updatedUser = { ...currentUser, ...updates };
            localStorage.setItem('loggedUser', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
