import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export const AnimatedCounter = ({
    value = 0,
    duration = 1000,
    prefix = '',
    suffix = '',
    style,
    textStyle
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = React.useState(0);

    useEffect(() => {
        animatedValue.setValue(0);

        Animated.timing(animatedValue, {
            toValue: value,
            duration: duration,
            useNativeDriver: false,
        }).start();

        animatedValue.addListener(({ value: v }) => {
            setDisplayValue(Math.round(v));
        });

        return () => {
            animatedValue.removeAllListeners();
        };
    }, [value]);

    return (
        <Animated.View style={style}>
            <Text style={[styles.text, textStyle]}>
                {prefix}{displayValue}{suffix}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
    },
});
