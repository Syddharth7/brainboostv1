import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { TextInput, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { supabase } from '../utils/supabase';

// Assets
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');
const LOGO = require('../../assets/images/logo.png');

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [section, setSection] = useState('');
    const [showSectionPicker, setShowSectionPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const theme = useTheme();

    const sections = ['Section A', 'Section B', 'Section C', 'Section D'];

    async function signUpWithEmail() {
        if (!username || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (!section) {
            Alert.alert('Error', 'Please select your section');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    section: section,
                },
            },
        });

        if (error) Alert.alert('Registration Failed', error.message);
        else Alert.alert('Success', 'Check your inbox for email verification!');
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
                                    <Text style={styles.welcomeText}>Join the Class! 🚀</Text>
                                </View>
                            </View>

                            {/* Username Input */}
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="account-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Username"
                                    value={username}
                                    onChangeText={setUsername}
                                    mode="flat"
                                    style={styles.input}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                    placeholderTextColor="#2D3436"
                                />
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
                                    placeholder="Password (min 6 chars)"
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

                            {/* Section Picker */}
                            <TouchableOpacity
                                style={styles.inputContainer}
                                onPress={() => setShowSectionPicker(!showSectionPicker)}
                            >
                                <MaterialCommunityIcons name="account-group-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                                <Text style={[styles.pickerText, !section && styles.placeholderText]}>
                                    {section || 'Select your section'}
                                </Text>
                                <MaterialCommunityIcons
                                    name={showSectionPicker ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#999"
                                    style={styles.chevronIcon}
                                />
                            </TouchableOpacity>

                            {/* Section Options */}
                            {showSectionPicker && (
                                <View style={styles.sectionOptions}>
                                    {sections.map((sec) => (
                                        <TouchableOpacity
                                            key={sec}
                                            style={[
                                                styles.sectionOption,
                                                section === sec && styles.sectionOptionSelected
                                            ]}
                                            onPress={() => {
                                                setSection(sec);
                                                setShowSectionPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.sectionOptionText,
                                                section === sec && styles.sectionOptionTextSelected
                                            ]}>
                                                {sec}
                                            </Text>
                                            {section === sec && (
                                                <MaterialCommunityIcons name="check" size={18} color="#6C63FF" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Sign Up Button */}
                            <TouchableOpacity
                                onPress={signUpWithEmail}
                                disabled={loading}
                                style={styles.signupButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.signupButtonText}>Create Account</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View style={styles.loginLinkContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.loginLink}>Login</Text>
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
        paddingTop: 60,
    },
    // Logo
    logoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 200,
        height: 200,
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
        marginBottom: 20,
    },
    brandName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 10,
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
        marginBottom: 14,
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
    // Sign Up Button
    signupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00B894',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingVertical: 14,
        marginTop: 8,
        gap: 8,
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Login Link
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#636E72',
        fontSize: 14,
    },
    loginLink: {
        color: '#6C63FF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Section Picker
    pickerText: {
        flex: 1,
        fontSize: 16,
        color: '#2D3436',
        paddingVertical: 12,
    },
    placeholderText: {
        color: '#999',
    },
    chevronIcon: {
        marginLeft: 8,
    },
    sectionOptions: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginBottom: 12,
        overflow: 'hidden',
    },
    sectionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    sectionOptionSelected: {
        backgroundColor: '#EEF2FF',
    },
    sectionOptionText: {
        fontSize: 15,
        color: '#2D3436',
    },
    sectionOptionTextSelected: {
        color: '#6C63FF',
        fontWeight: '600',
    },
});
