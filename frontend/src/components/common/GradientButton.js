import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { gameTheme } from '../../theme/gameTheme';

export const GradientButton = ({ onPress, children, colors, style, disabled, loading, icon, labelStyle }) => {
    const theme = useTheme();
    // Use provided colors, or theme gradients, or fallback to gameTheme gradients
    const disabledColors = ['#B2BEC3', '#B2BEC3'];
    const defaultGradient = theme?.colors?.gradients?.primary || gameTheme.colors.gradients.primary;
    const buttonColors = disabled
        ? disabledColors
        : (colors || defaultGradient);

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={buttonColors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <View style={styles.content}>
                        {icon && <MaterialCommunityIcons name={icon} size={24} color="#fff" style={styles.icon} />}
                        <Text style={[styles.text, labelStyle]}>{children}</Text>
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    gradient: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});
