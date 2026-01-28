import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { TextInput, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { supabase } from '../utils/supabase';

// Assets
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');
const LOGO = require('../../assets/images/logo.png');

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const theme = useTheme();

    async function signInWithEmail() {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Login Failed', error.message);
        setLoading(false);
    }

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Large Logo */}
                    <Animatable.View animation="bounceIn" duration={1000} style={styles.logoSection}>
                        <Image source={LOGO} style={styles.logo} />
                    </Animatable.View>

                    {/* Main Card with all content */}
                    <Animatable.View animation="fadeInUp" delay={300} style={styles.cardContainer}>
                        <View style={styles.card}>
                            {/* Title and Welcome inside card */}
                            <View style={styles.headerInCard}>
                                <Text style={styles.brandName}>TLE BrainBoost</Text>
                                <View style={styles.welcomeBadge}>
                                    <Text style={styles.welcomeText}>Welcome back, Student! 👋</Text>
                                </View>
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="email-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Email address"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    mode="flat"
                                    style={styles.input}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                    placeholderTextColor="#2D3436"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    mode="flat"
                                    style={styles.input}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                    placeholderTextColor="#2D3436"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <MaterialCommunityIcons
                                        name={showPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color="#999"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={signInWithEmail}
                                disabled={loading}
                                style={styles.loginButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.loginButtonText}>Login</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Sign Up Link */}
                            <View style={styles.signupLinkContainer}>
                                <Text style={styles.signupText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.signupLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animatable.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 80,
    },
    // Logo
    logoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 220,
        height: 220,
        resizeMode: 'contain',
    },
    // Card
    cardContainer: {
        width: '100%',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    // Header inside card
    headerInCard: {
        alignItems: 'center',
        marginBottom: 24,
    },
    brandName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
    },
    welcomeBadge: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    welcomeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    // Inputs
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 15,
        height: 50,
        color: '#2D3436',
    },
    eyeIcon: {
        padding: 8,
    },
    // Login Button
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6C63FF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingVertical: 14,
        marginTop: 8,
        gap: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Sign Up Link
    signupLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signupText: {
        color: '#636E72',
        fontSize: 14,
    },
    signupLink: {
        color: '#6C63FF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
