import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, G } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';

export const XPProgressRing = ({
    currentXP = 0,
    maxXP = 100,
    level = 1,
    size = 100,
    strokeWidth = 8,
    color = '#6C63FF',
    backgroundColor = '#E0E0E0'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(currentXP / maxXP, 1);
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <Animatable.View animation="fadeIn" duration={800}>
            <View style={[styles.container, { width: size, height: size }]}>
                <Svg width={size} height={size}>
                    <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                        {/* Background Circle */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={backgroundColor}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                        {/* Progress Circle */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </G>
                </Svg>
                <View style={styles.centerContent}>
                    <Text style={styles.levelText}>LVL</Text>
                    <Text style={[styles.levelNumber, { color }]}>{level}</Text>
                </View>
            </View>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#636E72',
        letterSpacing: 1,
    },
    levelNumber: {
        fontSize: 28,
        fontWeight: 'bold',
    },
});
