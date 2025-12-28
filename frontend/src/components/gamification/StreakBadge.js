import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export const StreakBadge = ({ streak = 0, size = 'medium' }) => {
    const isActive = streak > 0;

    const sizes = {
        small: { icon: 20, text: 14, padding: 8 },
        medium: { icon: 28, text: 18, padding: 12 },
        large: { icon: 36, text: 24, padding: 16 },
    };

    const { icon, text, padding } = sizes[size] || sizes.medium;

    return (
        <Animatable.View
            animation={isActive ? "pulse" : undefined}
            iterationCount="infinite"
            duration={2000}
        >
            <View style={[
                styles.container,
                { paddingHorizontal: padding, paddingVertical: padding / 2 },
                isActive ? styles.activeContainer : styles.inactiveContainer
            ]}>
                <MaterialCommunityIcons
                    name="fire"
                    size={icon}
                    color={isActive ? '#FF6B6B' : '#B2BEC3'}
                />
                <Text style={[
                    styles.streakText,
                    { fontSize: text },
                    isActive ? styles.activeText : styles.inactiveText
                ]}>
                    {streak}
                </Text>
            </View>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        gap: 4,
    },
    activeContainer: {
        backgroundColor: '#FFF5F5',
    },
    inactiveContainer: {
        backgroundColor: '#F5F5F5',
    },
    streakText: {
        fontWeight: 'bold',
    },
    activeText: {
        color: '#FF6B6B',
    },
    inactiveText: {
        color: '#B2BEC3',
    },
});
