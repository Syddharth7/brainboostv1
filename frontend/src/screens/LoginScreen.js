import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, useTheme, Surface } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { supabase } from '../utils/supabase';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Login Failed', error.message);
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.colors.primary }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Animatable.View
                        animation="swing"
                        iterationCount="infinite"
                        duration={2000}
                        style={styles.mascotContainer}
                    >
                        {/* Using a high-quality illustration for the mascot */}
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4202/4202831.png' }}
                            style={styles.mascot}
                        />
                    </Animatable.View>
                    <Animatable.Text animation="fadeInDown" delay={500} style={styles.welcomeText}>
                        Welcome Back! 👋
                    </Animatable.Text>
                    <Animatable.Text animation="fadeInDown" delay={700} style={styles.subtitleText}>
                        Ready to learn something new?
                    </Animatable.Text>
                </View>

                <Animatable.View animation="fadeInUp" delay={300} style={styles.formContainer}>
                    <Surface style={styles.card}>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            mode="outlined"
                            left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
                            style={styles.input}
                            theme={{ roundness: 12 }}
                        />
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            mode="outlined"
                            left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
                            right={<TextInput.Icon icon="eye" />}
                            style={styles.input}
                            theme={{ roundness: 12 }}
                        />

                        <Button
                            mode="contained"
                            onPress={signInWithEmail}
                            loading={loading}
                            style={styles.button}
                            contentStyle={{ height: 50 }}
                            labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
                        >
                            Login
                        </Button>

                        <Button
                            onPress={() => navigation.navigate('Register')}
                            style={styles.link}
                            labelStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
                        >
                            Don't have an account? Sign Up
                        </Button>
                    </Surface>
                </Animatable.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 40,
    },
    mascotContainer: {
        marginBottom: 20,
    },
    mascot: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    card: {
        padding: 24,
        borderRadius: 24,
        backgroundColor: '#fff',
        elevation: 8,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 10,
        borderRadius: 12,
        elevation: 4,
    },
    link: {
        marginTop: 16,
    },
});
