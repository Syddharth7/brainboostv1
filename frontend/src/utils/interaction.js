import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const SOUNDS = {
    click: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3',
    success: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/bonus.wav',
    error: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/explosion_01.mp3',
};

let soundObjects = {};

export const playSound = async (name) => {
    try {
        const { sound } = await Audio.Sound.createAsync({ uri: SOUNDS[name] });
        await sound.playAsync();
        // Unload sound from memory after playback to prevent leaks
        sound.setOnPlaybackStatusUpdate(async (status) => {
            if (status.didJustFinish) {
                await sound.unloadAsync();
            }
        });
    } catch (error) {
        console.log('Error playing sound', error);
    }
};

export const triggerHaptic = (type = 'selection') => {
    switch (type) {
        case 'impactLight':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        case 'impactMedium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
        case 'impactHeavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
        case 'notificationSuccess':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
        case 'notificationError':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        case 'selection':
        default:
            Haptics.selectionAsync();
            break;
    }
};
