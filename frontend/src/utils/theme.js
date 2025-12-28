import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const commonColors = {
    primary: '#6C63FF', // Modern purple
    accent: '#FF6584', // Vibrant pink
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#D63031',
    info: '#0984E3',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    // Gradients for LinearGradient components
    gradients: {
        primary: ['#6C63FF', '#3F3D56'],
        accent: ['#FF6584', '#FF8E53'],
        success: ['#00B894', '#55EFC4'],
        gold: ['#FFD700', '#FFA500'],
        blue: ['#0984E3', '#74B9FF'],
    },
    // Glass effect colors
    glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
};

export const lightTheme = {
    ...MD3LightTheme,
    roundness: 16,
    colors: {
        ...MD3LightTheme.colors,
        ...commonColors,
        background: '#F0F2F5',
        surface: '#FFFFFF',
        text: '#2D3436',
        disabled: '#B2BEC3',
        placeholder: '#636E72',
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    roundness: 16,
    colors: {
        ...MD3DarkTheme.colors,
        ...commonColors,
        primary: '#8C85FF', // Lighter purple for dark mode
        background: '#121212',
        surface: '#1E1E1E',
        text: '#E0E0E0',
        disabled: '#555555',
        placeholder: '#AAAAAA',
    },
};
