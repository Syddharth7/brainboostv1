import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export const AchievementBadge = ({
    icon = '🏆',
    title,
    unlocked = false,
    size = 'medium',
    onPress,
    delay = 0
}) => {
    const sizes = {
        small: { badge: 50, icon: 20, title: 10 },
        medium: { badge: 70, icon: 28, title: 12 },
        large: { badge: 90, icon: 36, title: 14 },
    };

    const { badge, icon: iconSize, title: titleSize } = sizes[size] || sizes.medium;

    const content = (
        <View style={styles.container}>
            <View style={[
                styles.badge,
                { width: badge, height: badge, borderRadius: badge / 2 },
                unlocked ? styles.unlockedBadge : styles.lockedBadge
            ]}>
                {unlocked ? (
                    <Text style={{ fontSize: iconSize }}>{icon}</Text>
                ) : (
                    <MaterialCommunityIcons name="lock" size={iconSize} color="#B2BEC3" />
                )}
            </View>
            {title && (
                <Text
                    style={[
                        styles.title,
                        { fontSize: titleSize },
                        !unlocked && styles.lockedTitle
                    ]}
                    numberOfLines={2}
                >
                    {title}
                </Text>
            )}
        </View>
    );

    if (onPress) {
        return (
            <Animatable.View animation="bounceIn" delay={delay}>
                <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                    {content}
                </TouchableOpacity>
            </Animatable.View>
        );
    }

    return (
        <Animatable.View animation="bounceIn" delay={delay}>
            {content}
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        margin: 8,
    },
    badge: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    unlockedBadge: {
        backgroundColor: '#FFF9E6',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    lockedBadge: {
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    title: {
        fontWeight: '600',
        color: '#2D3436',
        textAlign: 'center',
        width: 80,
    },
    lockedTitle: {
        color: '#B2BEC3',
    },
});
