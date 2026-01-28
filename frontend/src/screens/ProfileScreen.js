import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity, ImageBackground, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Avatar, Title, Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

// Background image
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

export default function ProfileScreen() {
    const { user, setSession, setUser } = useAuthStore();
    const theme = useTheme();
    const [stats, setStats] = useState({ completedLessons: 0, averageScore: 0, totalXP: 0, quizzesTaken: 0, totalQuizzes: 0 });
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [displayName, setDisplayName] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
            loadProfileData();
        }
    }, [user]);

    const loadProfileData = () => {
        // Load from user metadata
        const savedName = user?.user_metadata?.username || user?.user_metadata?.display_name || 'Student';
        const savedAvatar = user?.user_metadata?.avatar_url;
        setDisplayName(savedName);
        if (savedAvatar) setAvatarUrl(savedAvatar);
    };

    const fetchData = async () => {
        try {
            const progress = await api.progress.getUserProgress(user.id);
            const quizProgress = await api.progress.getUserQuizProgress(user.id);

            const completedLessons = progress.filter(p => p.completed).length;
            const totalScore = quizProgress.reduce((acc, curr) => acc + curr.score, 0);
            const avgScore = quizProgress.length > 0 ? Math.round(totalScore / quizProgress.length) : 0;
            const totalXP = (completedLessons * 100) + (totalScore * 10);

            let totalQuizzes = 10;
            try {
                const allQuizzes = await api.quizzes.getAll();
                totalQuizzes = allQuizzes?.length || 10;
            } catch {
                totalQuizzes = 10;
            }

            setStats({
                completedLessons,
                averageScore: avgScore,
                totalXP,
                quizzesTaken: quizProgress.length,
                totalQuizzes
            });
        } catch (error) {
            console.error(error);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library to change your avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (imageUri) => {
        try {
            setUploading(true);

            // Upload to Supabase Storage
            const publicUrl = await api.users.uploadAvatar(user.id, imageUri);

            // Update user profile with new avatar URL
            await api.users.updateProfile(user.id, {
                avatar_url: publicUrl,
                username: displayName
            });

            setAvatarUrl(publicUrl);

            // Refresh user data
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser && setUser) setUser(updatedUser);

            Alert.alert('Success', 'Avatar updated successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload avatar. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveName = async () => {
        if (editingName.trim()) {
            try {
                await api.users.updateProfile(user.id, {
                    username: editingName.trim(),
                    display_name: editingName.trim(),
                    avatar_url: avatarUrl
                });

                setDisplayName(editingName.trim());

                // Refresh user data
                const { data: { user: updatedUser } } = await supabase.auth.getUser();
                if (updatedUser && setUser) setUser(updatedUser);

                setShowEditModal(false);
                Alert.alert('Success', 'Name updated successfully!');
            } catch (error) {
                console.error('Update error:', error);
                Alert.alert('Error', 'Failed to update name. Please try again.');
            }
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) Alert.alert('Error', error.message);
                        else setSession(null);
                    }
                }
            ]
        );
    };

    const username = displayName || user?.user_metadata?.username || 'Student';
    const level = Math.floor(stats.totalXP / 500) + 1;
    const xpForNextLevel = level * 500;
    const currentLevelXP = stats.totalXP;
    const xpProgress = Math.min((currentLevelXP / xpForNextLevel) * 100, 100);

    // Achievement badges
    const allBadges = [
        { icon: 'star-outline', title: 'First Steps', description: 'Complete your first lesson', unlocked: stats.completedLessons >= 1, date: 'Jan 10, 2026', color: '#FFFFFF' },
        { icon: 'trophy-outline', title: 'Perfect Score', description: 'Get 100% on a quiz', unlocked: stats.averageScore >= 100, date: 'Jan 15, 2026', color: '#FFFFFF' },
        { icon: 'lightning-bolt', title: 'Week Warrior', description: '7-day learning streak', unlocked: true, date: 'Jan 18, 2026', color: '#FF9F43' },
        { icon: 'book-open-page-variant', title: 'Bookworm', description: 'Read 10 articles', unlocked: stats.completedLessons >= 3, date: 'Jan 20, 2026', color: '#FFFFFF' },
        { icon: 'target', title: 'Quick Learner', description: 'Complete 5 lessons in one day', unlocked: stats.completedLessons >= 5, date: 'Jan 12, 2026', color: '#FF6B6B' },
        { icon: 'calculator', title: 'Math Master', description: 'Complete all Math modules', unlocked: false, date: null, color: '#B2BEC3' },
    ];

    const unlockedCount = allBadges.filter(b => b.unlocked).length;

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* User Card */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.userCard}>
                    <View style={styles.userCardContent}>
                        {/* Avatar with Edit Button */}
                        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} disabled={uploading}>
                            <View style={styles.avatarCircle}>
                                {uploading ? (
                                    <ActivityIndicator size="large" color="#6C63FF" />
                                ) : avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                                ) : (
                                    <MaterialCommunityIcons name="account" size={50} color="#636E72" />
                                )}
                            </View>
                            <View style={styles.editAvatarBadge}>
                                <MaterialCommunityIcons name="camera" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.userDetails}>
                            <View style={styles.nameRow}>
                                <Title style={styles.username}>{username}</Title>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingName(username);
                                        setShowEditModal(true);
                                    }}
                                    style={styles.editNameButton}
                                >
                                    <MaterialCommunityIcons name="pencil" size={16} color="#636E72" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.badgesRow}>
                                <View style={styles.gradeBadge}>
                                    <Text style={styles.gradeBadgeText}>Grade 7 Student</Text>
                                </View>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelBadgeText}>Level {level}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* XP Progress */}
                    <View style={styles.xpSection}>
                        <View style={styles.xpHeader}>
                            <Text style={styles.xpLabel}>Progress to Level {level + 1}</Text>
                            <Text style={styles.xpValue}>{currentLevelXP} / {xpForNextLevel} XP</Text>
                        </View>
                        <View style={styles.xpProgressBar}>
                            <View style={[styles.xpProgressFill, { width: `${xpProgress}%` }]} />
                        </View>
                        <Text style={styles.xpPercent}>{Math.round(xpProgress)}%</Text>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={18} color="#fff" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </Animatable.View>

                {/* Performance Section */}
                <Animatable.View animation="fadeInUp" delay={200} style={styles.performanceCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📊</Text>
                        <Title style={styles.sectionTitle}>Your Performance</Title>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={styles.statIconRow}>
                                <MaterialCommunityIcons name="check-circle-outline" size={16} color="#636E72" />
                                <Text style={styles.statLabel}>Quizzes Completed</Text>
                            </View>
                            <Text style={styles.statValue}>{stats.quizzesTaken}/{stats.totalQuizzes}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statIconRow}>
                                <MaterialCommunityIcons name="target" size={16} color="#636E72" />
                                <Text style={styles.statLabel}>Overall Accuracy</Text>
                            </View>
                            <Text style={styles.statValue}>{stats.averageScore}%</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statIconRow}>
                                <MaterialCommunityIcons name="trophy-outline" size={16} color="#636E72" />
                                <Text style={styles.statLabel}>Badges Earned</Text>
                            </View>
                            <Text style={styles.statValue}>{unlockedCount}/{allBadges.length}</Text>
                        </View>
                    </View>
                </Animatable.View>

                {/* Achievement Badges */}
                <Animatable.View animation="fadeInUp" delay={400} style={styles.achievementsCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>🏆</Text>
                        <Title style={styles.sectionTitle}>Achievement Badges</Title>
                    </View>

                    <View style={styles.badgesGrid}>
                        {/* Create rows of 2 badges each */}
                        {Array.from({ length: Math.ceil(allBadges.length / 2) }).map((_, rowIndex) => (
                            <View key={rowIndex} style={styles.badgeRow}>
                                {allBadges.slice(rowIndex * 2, rowIndex * 2 + 2).map((badge, index) => (
                                    <Animatable.View
                                        key={rowIndex * 2 + index}
                                        animation="fadeIn"
                                        delay={500 + (rowIndex * 2 + index) * 50}
                                        style={[
                                            styles.badgeCard,
                                            { backgroundColor: badge.unlocked ? '#FFFFFF' : '#F5F5F5' }
                                        ]}
                                    >
                                        {badge.unlocked && (
                                            <View style={styles.unlockedDot} />
                                        )}
                                        <View style={[styles.badgeIconCircle, !badge.unlocked && styles.lockedIconCircle]}>
                                            <MaterialCommunityIcons
                                                name={badge.icon}
                                                size={24}
                                                color={badge.unlocked ? '#2D3436' : '#B2BEC3'}
                                            />
                                        </View>
                                        <Text style={[styles.badgeTitle, !badge.unlocked && styles.lockedText]} numberOfLines={1}>
                                            {badge.title}
                                        </Text>
                                        <Text style={[styles.badgeDescription, !badge.unlocked && styles.lockedText]} numberOfLines={2}>
                                            {badge.description}
                                        </Text>
                                        {badge.unlocked ? (
                                            <Text style={styles.badgeDate}>{badge.date}</Text>
                                        ) : (
                                            <View style={styles.lockedBadge}>
                                                <MaterialCommunityIcons name="lock" size={10} color="#fff" />
                                                <Text style={styles.lockedBadgeText}>Locked</Text>
                                            </View>
                                        )}
                                    </Animatable.View>
                                ))}
                            </View>
                        ))}
                    </View>
                </Animatable.View>

            </ScrollView>

            {/* Edit Name Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Title style={styles.modalTitle}>Edit Name</Title>
                        <TextInput
                            style={styles.nameInput}
                            value={editingName}
                            onChangeText={setEditingName}
                            placeholder="Enter your name"
                            placeholderTextColor="#B2BEC3"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowEditModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveName}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    // User Card
    userCard: {
        margin: 16,
        marginTop: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    userCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 16,
        position: 'relative',
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0F0F0',
        borderWidth: 3,
        borderColor: '#2D3436',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    username: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    editNameButton: {
        padding: 4,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    gradeBadge: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    gradeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2D3436',
    },
    levelBadge: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    levelBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2D3436',
    },
    // XP Section
    xpSection: {
        marginTop: 20,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    xpLabel: {
        fontSize: 13,
        color: '#636E72',
    },
    xpValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2D3436',
    },
    xpProgressBar: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    xpProgressFill: {
        height: '100%',
        backgroundColor: '#2D3436',
        borderRadius: 6,
    },
    xpPercent: {
        textAlign: 'right',
        fontSize: 12,
        color: '#636E72',
        marginTop: 4,
    },
    // Logout Button
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
        gap: 6,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Performance Card
    performanceCard: {
        margin: 16,
        marginTop: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionIcon: {
        fontSize: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        padding: 14,
    },
    statIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 10,
        color: '#636E72',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    // Achievements Card
    achievementsCard: {
        margin: 16,
        marginTop: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    badgesGrid: {
        marginTop: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    badgeCard: {
        width: '48%',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#2D3436',
        padding: 12,
        position: 'relative',
    },
    unlockedDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00B894',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    lockedIconCircle: {
        backgroundColor: '#E8E8E8',
    },
    badgeTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 2,
        textAlign: 'center',
    },
    badgeDescription: {
        fontSize: 11,
        color: '#636E72',
        marginBottom: 6,
        textAlign: 'center',
    },
    badgeDate: {
        fontSize: 10,
        color: '#00B894',
        fontWeight: '500',
        textAlign: 'center',
    },
    lockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    lockedBadgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '600',
    },
    lockedText: {
        color: '#B2BEC3',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width - 64,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 16,
        textAlign: 'center',
    },
    nameInput: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2D3436',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#636E72',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#6C63FF',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
