import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

export const StreakCounter = ({ streak }) => {
    return (
        <View style={styles.container}>
            <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                duration={1500}
            >
                <Image
                    source={require('../../../assets/images/streak_fire.png')}
                    style={styles.icon}
                    resizeMode="contain"
                />
            </Animatable.View>
            <Text style={styles.text}>{streak}</Text>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 6,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B', // Fire color
    }
});
