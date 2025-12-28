import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { Avatar, Title, Text, Button, useTheme, List, Divider, Switch, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';
import { api } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import { XPProgressRing, AchievementBadge, StatCard } from '../components/gamification';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { user, setSession } = useAuthStore();
    const theme = useTheme();
    const { isDark, toggleTheme } = useAppTheme();
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState({ completedLessons: 0, averageScore: 0, totalXP: 0, quizzesTaken: 0 });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const achievementsData = await api.achievements.getUserAchievements(user.id);
            setAchievements(achievementsData);

            const progress = await api.progress.getUserProgress(user.id);
            const quizProgress = await api.progress.getUserQuizProgress(user.id);

            const completedLessons = progress.filter(p => p.completed).length;
            const totalScore = quizProgress.reduce((acc, curr) => acc + curr.score, 0);
            const avgScore = quizProgress.length > 0 ? Math.round(totalScore / quizProgress.length) : 0;
            const totalXP = (completedLessons * 100) + (totalScore * 10);

            setStats({
                completedLessons,
                averageScore: avgScore,
                totalXP,
                quizzesTaken: quizProgress.length
            });
        } catch (error) {
            console.error(error);
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

    const username = user?.user_metadata?.username || 'Student';
    const email = user?.email || '';
    const joinDate = new Date(user?.created_at).toLocaleDateString();
    const level = Math.floor(stats.totalXP / 500) + 1;
    const xpForNextLevel = level * 500;
    const currentLevelXP = stats.totalXP % 500;

    // Sample achievements for demo
    const allBadges = [
        { icon: '🚀', title: 'First Steps', unlocked: true },
        { icon: '📚', title: 'Bookworm', unlocked: stats.completedLessons >= 3 },
        { icon: '🧠', title: 'Quiz Master', unlocked: stats.quizzesTaken >= 5 },
        { icon: '⭐', title: 'Star Student', unlocked: stats.averageScore >= 80 },
        { icon: '🔥', title: 'On Fire', unlocked: false },
        { icon: '🏆', title: 'Champion', unlocked: false },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <XPProgressRing
                            currentXP={currentLevelXP}
                            maxXP={500}
                            level={level}
                            size={120}
                            strokeWidth={8}
                            color={theme.colors.primary}
                        />
                    </View>
                    <Title style={styles.username}>{username}</Title>
                    <Text style={styles.email}>{email}</Text>
                </Animatable.View>

                {/* Stats Row */}
                <Animatable.View animation="fadeInUp" delay={200} style={styles.statsRow}>
                    <StatCard
                        icon="book-check"
                        value={stats.completedLessons}
                        label="Lessons"
                        color="#6C63FF"
                        style={styles.statCard}
                    />
                    <StatCard
                        icon="file-document-edit"
                        value={stats.quizzesTaken}
                        label="Quizzes"
                        color="#FF6584"
                        style={styles.statCard}
                    />
                    <StatCard
                        icon="percent"
                        value={`${stats.averageScore}%`}
                        label="Accuracy"
                        color="#00B894"
                        style={styles.statCard}
                    />
                </Animatable.View>

                {/* Total XP Card */}
                <Animatable.View animation="fadeInUp" delay={300}>
                    <Card style={styles.xpCard}>
                        <Card.Content style={styles.xpCardContent}>
                            <MaterialCommunityIcons name="star" size={32} color="#FFD700" />
                            <View style={styles.xpInfo}>
                                <Text style={styles.xpLabel}>Total Experience Points</Text>
                                <Title style={styles.xpValue}>{stats.totalXP} XP</Title>
                            </View>
                        </Card.Content>
                    </Card>
                </Animatable.View>

                {/* Achievements Gallery */}
                <Animatable.View animation="fadeInUp" delay={400}>
                    <Title style={styles.sectionTitle}>🏆 Achievement Gallery</Title>
                    <View style={styles.badgesContainer}>
                        {allBadges.map((badge, index) => (
                            <AchievementBadge
                                key={index}
                                icon={badge.icon}
                                title={badge.title}
                                unlocked={badge.unlocked}
                                size="medium"
                                delay={500 + index * 100}
                            />
                        ))}
                    </View>
                </Animatable.View>

                {/* Settings */}
                <Animatable.View animation="fadeInUp" delay={600}>
                    <Card style={styles.settingsCard}>
                        <List.Section>
                            <List.Subheader style={styles.listSubheader}>Settings</List.Subheader>
                            <List.Item
                                title="Dark Mode"
                                titleStyle={styles.listItemTitle}
                                left={props => <List.Icon {...props} icon="theme-light-dark" color="#636E72" />}
                                right={() => <Switch value={isDark} onValueChange={toggleTheme} color={theme.colors.primary} />}
                            />
                            <Divider />
                            <List.Item
                                title="Notifications"
                                titleStyle={styles.listItemTitle}
                                left={props => <List.Icon {...props} icon="bell-outline" color="#636E72" />}
                                right={props => <List.Icon {...props} icon="chevron-right" color="#B2BEC3" />}
                                onPress={() => { }}
                            />
                            <Divider />
                            <List.Item
                                title="Privacy & Security"
                                titleStyle={styles.listItemTitle}
                                left={props => <List.Icon {...props} icon="shield-check-outline" color="#636E72" />}
                                right={props => <List.Icon {...props} icon="chevron-right" color="#B2BEC3" />}
                                onPress={() => { }}
                            />
                            <Divider />
                            <List.Item
                                title="Help & Support"
                                titleStyle={styles.listItemTitle}
                                left={props => <List.Icon {...props} icon="help-circle-outline" color="#636E72" />}
                                right={props => <List.Icon {...props} icon="chevron-right" color="#B2BEC3" />}
                                onPress={() => { }}
                            />
                        </List.Section>
                    </Card>
                </Animatable.View>

                {/* Logout Button */}
                <Animatable.View animation="fadeInUp" delay={700}>
                    <Button
                        mode="outlined"
                        onPress={handleLogout}
                        style={styles.logoutButton}
                        textColor="#E17055"
                        icon="logout"
                    >
                        Log Out
                    </Button>
                    <Text style={styles.versionText}>Version 1.0.0 • Joined {joinDate}</Text>
                </Animatable.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    email: {
        color: '#636E72',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
    },
    xpCard: {
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        backgroundColor: '#FFF9E6',
        elevation: 0,
    },
    xpCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    xpInfo: {
        marginLeft: 16,
    },
    xpLabel: {
        fontSize: 12,
        color: '#636E72',
    },
    xpValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFB800',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 12,
        color: '#2D3436',
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 12,
        marginBottom: 24,
    },
    settingsCard: {
        marginHorizontal: 20,
        borderRadius: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
        elevation: 2,
    },
    listSubheader: {
        color: '#636E72',
    },
    listItemTitle: {
        color: '#2D3436',
    },
    logoutButton: {
        marginHorizontal: 20,
        borderRadius: 12,
        borderColor: '#E17055',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#B2BEC3',
        fontSize: 12,
    },
});
