import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Title, Text, Avatar, ProgressBar, useTheme, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { XPProgressRing, StreakBadge, StatCard } from '../components/gamification';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const { user } = useAuthStore();
    const theme = useTheme();

    const [progress, setProgress] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ lessons: 0, avgScore: 0, xp: 0 });

    const username = user?.user_metadata?.username || 'Student';
    const level = 5;
    const xp = 1250;
    const nextLevelXp = 2000;
    const streak = user?.streak_days || 3;

    const fetchProgress = async () => {
        try {
            const totalTopics = 12;
            const userProgress = await api.progress.getUserProgress(user.id);
            const quizProgress = await api.progress.getUserQuizProgress(user.id);

            const completedCount = userProgress.filter(p => p.completed).length;
            setProgress(completedCount / totalTopics);

            const totalScore = quizProgress.reduce((acc, curr) => acc + curr.score, 0);
            const avgScore = quizProgress.length > 0 ? Math.round(totalScore / quizProgress.length) : 0;

            setStats({
                lessons: completedCount,
                avgScore: avgScore,
                xp: (completedCount * 100) + (totalScore * 10)
            });
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) fetchProgress();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProgress();
    };

    const menuItems = [
        { title: 'Lessons', subtitle: 'Continue Learning', icon: 'book-open-variant', screen: 'Lessons', color: '#6C63FF' },
        { title: 'Quiz', subtitle: 'Test Knowledge', icon: 'brain', screen: 'Quiz', color: '#FF6584' },
        { title: 'Leaderboard', subtitle: 'Top Students', icon: 'trophy', screen: 'Leaderboard', color: '#FFD700' },
        { title: 'Profile', subtitle: 'Your Stats', icon: 'account-circle', screen: 'Profile', color: '#00B894' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Title style={styles.username}>{username}</Title>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <Avatar.Text
                            size={50}
                            label={username.substring(0, 2).toUpperCase()}
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                    </TouchableOpacity>
                </Animatable.View>

                {/* Level & Streak Row */}
                <Animatable.View animation="fadeInUp" delay={200} style={styles.levelRow}>
                    <View style={styles.levelContainer}>
                        <XPProgressRing
                            currentXP={xp}
                            maxXP={nextLevelXp}
                            level={level}
                            size={90}
                            color={theme.colors.primary}
                        />
                        <View style={styles.xpInfo}>
                            <Text style={styles.xpLabel}>Experience Points</Text>
                            <Text style={[styles.xpValue, { color: theme.colors.primary }]}>{xp} / {nextLevelXp} XP</Text>
                            <ProgressBar
                                progress={xp / nextLevelXp}
                                color={theme.colors.primary}
                                style={styles.xpBar}
                            />
                        </View>
                    </View>
                    <StreakBadge streak={streak} size="medium" />
                </Animatable.View>

                {/* Quick Stats */}
                <Animatable.View animation="fadeInUp" delay={400} style={styles.statsRow}>
                    <StatCard
                        icon="book-check"
                        value={stats.lessons}
                        label="Lessons"
                        color="#6C63FF"
                        delay={500}
                        style={styles.statCard}
                    />
                    <StatCard
                        icon="percent"
                        value={`${stats.avgScore}%`}
                        label="Avg Score"
                        color="#00B894"
                        delay={600}
                        style={styles.statCard}
                    />
                    <StatCard
                        icon="star"
                        value={stats.xp}
                        label="Total XP"
                        color="#FFD700"
                        delay={700}
                        style={styles.statCard}
                    />
                </Animatable.View>

                {/* Progress Card */}
                <Animatable.View animation="fadeInUp" delay={600}>
                    <Card style={styles.progressCard}>
                        <Card.Content>
                            <View style={styles.progressHeader}>
                                <Title style={styles.cardTitle}>Your Journey</Title>
                                <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
                                    {Math.round(progress * 100)}%
                                </Text>
                            </View>
                            <ProgressBar progress={progress} color={theme.colors.primary} style={styles.mainProgressBar} />
                            <Text style={styles.motivationText}>
                                {progress < 0.3 ? "You're just getting started! Keep going! 💪" :
                                    progress < 0.7 ? "Great progress! You're doing amazing! 🌟" :
                                        progress < 1 ? "Almost there! Finish strong! 🚀" :
                                            "Congratulations! You've completed everything! 🎉"}
                            </Text>
                        </Card.Content>
                    </Card>
                </Animatable.View>

                {/* Menu Grid */}
                <Title style={styles.sectionTitle}>Explore</Title>
                <View style={styles.menuGrid}>
                    {menuItems.map((item, index) => (
                        <Animatable.View
                            key={index}
                            animation="fadeInUp"
                            delay={800 + index * 100}
                            style={styles.menuItem}
                        >
                            <TouchableOpacity
                                onPress={() => navigation.navigate(item.screen)}
                                activeOpacity={0.7}
                            >
                                <Card style={styles.menuCard}>
                                    <Card.Content style={styles.menuCardContent}>
                                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                                            <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                                        </View>
                                        <Text style={styles.menuTitle}>{item.title}</Text>
                                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                    </Card.Content>
                                </Card>
                            </TouchableOpacity>
                        </Animatable.View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
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
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    greeting: {
        fontSize: 14,
        color: '#636E72',
    },
    username: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    xpInfo: {
        marginLeft: 16,
        flex: 1,
    },
    xpLabel: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 4,
    },
    xpValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    xpBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E0E0E0',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
    },
    progressCard: {
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        elevation: 2,
        backgroundColor: '#fff',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    mainProgressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E0E0E0',
    },
    motivationText: {
        marginTop: 12,
        fontSize: 14,
        color: '#636E72',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 16,
        color: '#2D3436',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
    },
    menuItem: {
        width: '50%',
        padding: 8,
    },
    menuCard: {
        borderRadius: 16,
        elevation: 2,
        backgroundColor: '#fff',
    },
    menuCardContent: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#636E72',
    },
});
