import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Image, ImageBackground } from 'react-native';
import { Title, Avatar, Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

// Background image
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

// Avatar component that shows image or fallback initials
const UserAvatar = ({ user, size, style, borderColor = '#2D3436' }) => {
    if (user?.avatar_url) {
        return (
            <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 2, borderColor }, style]}>
                <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%' }} />
            </View>
        );
    }
    return (
        <View style={[{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#F5F5F5',
            borderWidth: 2,
            borderColor,
            justifyContent: 'center',
            alignItems: 'center'
        }, style]}>
            <Text style={{ fontSize: size * 0.35, fontWeight: 'bold', color: '#2D3436' }}>
                {(user?.username || 'U').substring(0, 2).toUpperCase()}
            </Text>
        </View>
    );
};

// Points badge with different colors
const PointsBadge = ({ points, color = '#FF6B6B' }) => (
    <View style={[styles.pointsBadge, { backgroundColor: color }]}>
        <Text style={styles.pointsBadgeValue}>{points}</Text>
        <Text style={styles.pointsBadgeLabel}>points</Text>
    </View>
);

export default function LeaderboardScreen() {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLeaderboard = async () => {
        try {
            let data = await api.leaderboard.getTopStudents();

            // Merge current user's avatar from auth metadata (fallback if users table not updated)
            const currentUserId = user?.id;
            const currentUserAvatar = user?.user_metadata?.avatar_url;
            const currentUsername = user?.user_metadata?.username;

            if (currentUserId && currentUserAvatar) {
                data = data.map(student => {
                    // Match by id or username
                    if (student.id === currentUserId || student.username === currentUsername) {
                        return {
                            ...student,
                            avatar_url: student.avatar_url || currentUserAvatar
                        };
                    }
                    return student;
                });
            }

            console.log('Leaderboard data:', data); // Debug log
            setStudents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [user]); // Re-fetch when user changes

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaderboard();
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const topThree = students.slice(0, 3);
    const rest = students.slice(3, 10);
    const currentUsername = user?.user_metadata?.username;

    // Find current user's position
    const userIndex = students.findIndex(s => s.username === currentUsername || s.id === user?.id);
    const userRank = userIndex >= 0 ? userIndex + 1 : 15;
    const userPoints = userIndex >= 0 ? students[userIndex].points || 1450 : 1450;

    // Colors for point badges
    const badgeColors = ['#FF6B6B', '#6C63FF', '#FF9F43', '#00B894', '#FF6B6B', '#6C63FF', '#FF9F43'];

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                    {/* Leaderboard Badge */}
                    <View style={styles.learnHubBadge}>
                        <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                        <Text style={styles.learnHubText}>Leaderboard</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Top Performers This Week</Text>
                </Animatable.View>

                {/* Top 3 Podium */}
                <Animatable.View animation="fadeIn" delay={300} style={styles.podiumContainer}>
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <Animatable.View animation="bounceIn" delay={500} style={styles.podiumCard}>
                            <View style={styles.trophyIcon}>
                                <MaterialCommunityIcons name="trophy-outline" size={20} color="#B2BEC3" />
                            </View>
                            <UserAvatar user={topThree[1]} size={50} />
                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].username}</Text>
                            <View style={styles.podiumPointsBadge}>
                                <Text style={styles.podiumPoints}>{topThree[1].points || 2650} pts</Text>
                            </View>
                        </Animatable.View>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <Animatable.View animation="bounceIn" delay={300} style={[styles.podiumCard, styles.podiumCardFirst]}>
                            <View style={styles.trophyIcon}>
                                <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
                            </View>
                            <UserAvatar user={topThree[0]} size={60} />
                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].username}</Text>
                            <View style={[styles.podiumPointsBadge, styles.podiumPointsBadgeFirst]}>
                                <Text style={styles.podiumPoints}>{topThree[0].points || 2840} pts</Text>
                            </View>
                        </Animatable.View>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <Animatable.View animation="bounceIn" delay={700} style={styles.podiumCard}>
                            <View style={styles.trophyIcon}>
                                <MaterialCommunityIcons name="trophy-outline" size={20} color="#CD7F32" />
                            </View>
                            <UserAvatar user={topThree[2]} size={50} />
                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].username}</Text>
                            <View style={styles.podiumPointsBadge}>
                                <Text style={styles.podiumPoints}>{topThree[2].points || 2480} pts</Text>
                            </View>
                        </Animatable.View>
                    )}
                </Animatable.View>

                {/* Rest of the list */}
                <Animatable.View animation="fadeInUp" delay={600} style={styles.listCard}>
                    {rest.map((student, index) => {
                        const rank = index + 4;
                        const isCurrentUser = student.username === currentUsername;
                        const badgeColor = badgeColors[index % badgeColors.length];

                        return (
                            <View key={`student-${rank}-${student.username}`} style={[styles.listItem, isCurrentUser && styles.currentUserItem]}>
                                <Text style={styles.rankText}>#{rank}</Text>
                                <UserAvatar
                                    user={student}
                                    size={40}
                                    borderColor={badgeColor}
                                />
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.username}</Text>
                                </View>
                                <PointsBadge points={student.points || 2000 - index * 100} color={badgeColor} />
                            </View>
                        );
                    })}
                </Animatable.View>

                {/* Your Position Card */}
                <Animatable.View animation="fadeInUp" delay={800} style={styles.yourPositionCard}>
                    <View style={styles.yourPositionLeft}>
                        <MaterialCommunityIcons name="star-outline" size={24} color="#2D3436" />
                        <View style={styles.yourPositionInfo}>
                            <Text style={styles.yourPositionTitle}>Your Position</Text>
                            <Text style={styles.yourPositionSubtitle}>You're #{userRank} - Keep going! 🎉</Text>
                        </View>
                    </View>
                    <Text style={styles.yourPositionPoints}>{userPoints.toLocaleString()} pts</Text>
                </Animatable.View>

            </ScrollView>
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
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    // Header
    header: {
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    learnHubBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#2D3436',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bookIconContainer: {
        flexDirection: 'row',
        marginRight: 10,
    },
    bookPage: {
        width: 6,
        height: 18,
        borderRadius: 2,
    },
    learnHubText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
    },
    // Podium
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 12,
    },
    podiumCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        alignItems: 'center',
        width: (width - 56) / 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    podiumCardFirst: {
        paddingVertical: 20,
        marginBottom: 10,
    },
    trophyIcon: {
        marginBottom: 8,
    },
    podiumName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2D3436',
        marginTop: 8,
        textAlign: 'center',
    },
    podiumPointsBadge: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 8,
    },
    podiumPointsBadgeFirst: {
        borderColor: '#2D3436',
    },
    podiumPoints: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    streakText: {
        fontSize: 10,
        color: '#FF6B6B',
    },
    // List Card
    listCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        marginHorizontal: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        padding: 12,
        marginBottom: 10,
    },
    currentUserItem: {
        borderColor: '#6C63FF',
        backgroundColor: '#F5F4FF',
    },
    rankText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3436',
        width: 35,
    },
    studentInfo: {
        flex: 1,
        marginLeft: 10,
    },
    studentName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    studentStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statText: {
        fontSize: 11,
        color: '#636E72',
        marginLeft: 4,
    },
    // Points Badge
    pointsBadge: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    pointsBadgeValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    pointsBadgeLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.8)',
    },
    // Your Position Card
    yourPositionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    yourPositionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    yourPositionInfo: {},
    yourPositionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    yourPositionSubtitle: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    yourPositionPoints: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
});
