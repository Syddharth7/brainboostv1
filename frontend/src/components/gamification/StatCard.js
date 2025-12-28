import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export const StatCard = ({
    icon,
    value,
    label,
    color = '#6C63FF',
    delay = 0,
    style
}) => {
    return (
        <Animatable.View
            animation="fadeInUp"
            delay={delay}
            style={[styles.container, style]}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.value, { color }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        minWidth: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: '#636E72',
        textAlign: 'center',
    },
});
