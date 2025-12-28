import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../utils/theme';
import { Provider as PaperProvider } from 'react-native-paper';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const [theme, setTheme] = useState(lightTheme);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme === 'dark') {
                setIsDark(true);
                setTheme(darkTheme);
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        }
    };

    const toggleTheme = async () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        setTheme(newIsDark ? darkTheme : lightTheme);
        try {
            await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
            <PaperProvider theme={theme}>
                {children}
            </PaperProvider>
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => useContext(ThemeContext);
