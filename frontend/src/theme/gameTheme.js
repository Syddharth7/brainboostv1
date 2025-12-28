import { DefaultTheme } from 'react-native-paper';

export const gameTheme = {
    ...DefaultTheme,
    roundness: 20,
    colors: {
        ...DefaultTheme.colors,
        primary: '#6C63FF', // Vibrant Purple
        accent: '#FF6584', // Hot Pink
        background: '#F0F2F5', // Light Grey
        surface: '#ffffff',
        text: '#2D3436',
        disabled: '#DFE6E9',
        placeholder: '#B2BEC3',
        success: '#00B894', // Mint Green
        error: '#D63031', // Red
        warning: '#FDCB6E', // Mustard
        info: '#0984E3', // Blue

        // Gradients
        gradients: {
            primary: ['#6C63FF', '#3F3D56'],
            accent: ['#FF6584', '#FF8E53'],
            success: ['#00B894', '#55EFC4'],
            gold: ['#FFD700', '#FFA500'],
            blue: ['#0984E3', '#74B9FF'],
        },

        // Glass
        glass: {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.5)',
        }
    },
    animation: {
        scale: 1.0,
    },
};
