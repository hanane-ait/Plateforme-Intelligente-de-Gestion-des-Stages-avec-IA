import { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user_info');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // Un seul et unique appel HTTP part d'ici vers Django
        const response = await API.post('auth/login/', { username, password });
        
        const tokenAccess = response.data.access || response.data.token;
        const tokenRefresh = response.data.refresh;

        localStorage.setItem('access_token', tokenAccess);
        if (tokenRefresh) {
            localStorage.setItem('refresh_token', tokenRefresh);
        }

        // Récupération dynamique selon la structure de votre dictionnaire Django
        const backendUser = response.data.user || response.data;
        
        const userInfo = { 
            username: backendUser.username, 
            role: backendUser.role 
        }; 

        setUser(userInfo);
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};