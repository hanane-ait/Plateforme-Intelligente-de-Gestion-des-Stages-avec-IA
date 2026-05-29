import { createContext, useState, useEffect, useCallback } from 'react';
import API, { clearStoredAuth } from '../services/api';

export const AuthContext = createContext();

function normalizeUser(data) {
    if (!data) return null;
    return {
        id: data.id,
        username: data.username,
        email: data.email || '',
        role: data.role,
        telephone: data.telephone || '',
    };
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const persistUser = useCallback((userInfo) => {
        setUser(userInfo);
        if (userInfo) {
            localStorage.setItem('user_info', JSON.stringify(userInfo));
        } else {
            localStorage.removeItem('user_info');
        }
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        try {
            const response = await API.get('auth/me/');
            const userInfo = normalizeUser(response.data);
            persistUser(userInfo);
            return userInfo;
        } catch (err) {
            if (err.response?.status === 401) {
                clearStoredAuth();
                setUser(null);
            }
            return null;
        }
    }, [persistUser]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user_info');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            fetchCurrentUser().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [fetchCurrentUser]);

    const login = async (username, password) => {
        const response = await API.post('auth/login/', { username, password });

        const tokenAccess = response.data.access || response.data.token;
        const tokenRefresh = response.data.refresh;

        localStorage.setItem('access_token', tokenAccess);
        if (tokenRefresh) {
            localStorage.setItem('refresh_token', tokenRefresh);
        }

        const backendUser = response.data.user || response.data;
        const userInfo = normalizeUser(backendUser);

        persistUser(userInfo);

        return response.data;
    };

    const updateUser = async (payload) => {
        const response = await API.patch('auth/me/', payload);
        const userInfo = normalizeUser(response.data);
        persistUser(userInfo);
        return userInfo;
    };

    const logout = () => {
        clearStoredAuth();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, login, logout, loading, updateUser, fetchCurrentUser }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};
