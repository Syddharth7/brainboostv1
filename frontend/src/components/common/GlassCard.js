import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from 'react-native-paper';

export const GlassCard = ({ children, style, intensity = 20 }) => {
    const theme = useTheme();

    // Android doesn't support BlurView well in some versions, fallback to semi-transparent view
    if (Platform.OS === 'android') {
        return (
            <View style={[styles.container, styles.androidFallback, style]}>
                {children}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={intensity} tint="light" style={styles.blur}>
                <View style={styles.content}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    androidFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 0,
    },
    blur: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    }
});
