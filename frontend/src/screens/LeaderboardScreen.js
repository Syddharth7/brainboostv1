import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Title, Avatar, Text, ActivityIndicator, useTheme, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLeaderboard = async () => {
        try {
            const data = await api.leaderboard.getTopStudents();
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
    }, []);

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
    const rest = students.slice(3);
    const currentUsername = user?.user_metadata?.username;

    const getMedalInfo = (rank) => {
        switch (rank) {
            case 1: return { emoji: '🥇', color: '#FFD700', bgColor: '#FFF9E6' };
            case 2: return { emoji: '🥈', color: '#C0C0C0', bgColor: '#F5F5F5' };
            case 3: return { emoji: '🥉', color: '#CD7F32', bgColor: '#FDF5EE' };
            default: return { emoji: '', color: theme.colors.primary, bgColor: '#F8F9FA' };
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                    <Title style={styles.headerTitle}>Leaderboard</Title>
                    <Text style={styles.headerSubtitle}>Top Performers This Week</Text>
                </Animatable.View>

                {/* Top 3 Podium */}
                <Animatable.View animation="fadeIn" delay={300} style={styles.podiumContainer}>
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <Animatable.View animation="bounceIn" delay={500} style={[styles.podiumItem, styles.podiumSecond]}>
                            <Text style={styles.medal}>{getMedalInfo(2).emoji}</Text>
                            <Avatar.Text
                                size={60}
                                label={topThree[1].username.substring(0, 2).toUpperCase()}
                                style={{ backgroundColor: getMedalInfo(2).color }}
                            />
                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].username}</Text>
                            <View style={[styles.pointsBadge, { backgroundColor: getMedalInfo(2).bgColor }]}>
                                <Text style={[styles.pointsText, { color: getMedalInfo(2).color }]}>
                                    {topThree[1].total_points} XP
                                </Text>
                            </View>
                            <View style={[styles.podiumBase, { height: 60, backgroundColor: getMedalInfo(2).color + '30' }]}>
                                <Text style={[styles.rankNumber, { color: getMedalInfo(2).color }]}>2</Text>
                            </View>
                        </Animatable.View>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <Animatable.View animation="bounceIn" delay={300} style={[styles.podiumItem, styles.podiumFirst]}>
                            <Text style={styles.crown}>👑</Text>
                            <Text style={styles.medal}>{getMedalInfo(1).emoji}</Text>
                            <Avatar.Text
                                size={80}
                                label={topThree[0].username.substring(0, 2).toUpperCase()}
                                style={{ backgroundColor: getMedalInfo(1).color }}
                            />
                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].username}</Text>
                            <View style={[styles.pointsBadge, { backgroundColor: getMedalInfo(1).bgColor }]}>
                                <Text style={[styles.pointsText, styles.pointsTextFirst, { color: getMedalInfo(1).color }]}>
                                    {topThree[0].total_points} XP
                                </Text>
                            </View>
                            <View style={[styles.podiumBase, { height: 80, backgroundColor: getMedalInfo(1).color + '30' }]}>
                                <Text style={[styles.rankNumber, { color: getMedalInfo(1).color }]}>1</Text>
                            </View>
                        </Animatable.View>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <Animatable.View animation="bounceIn" delay={700} style={[styles.podiumItem, styles.podiumThird]}>
                            <Text style={styles.medal}>{getMedalInfo(3).emoji}</Text>
                            <Avatar.Text
                                size={50}
                                label={topThree[2].username.substring(0, 2).toUpperCase()}
                                style={{ backgroundColor: getMedalInfo(3).color }}
                            />
                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].username}</Text>
                            <View style={[styles.pointsBadge, { backgroundColor: getMedalInfo(3).bgColor }]}>
                                <Text style={[styles.pointsText, { color: getMedalInfo(3).color }]}>
                                    {topThree[2].total_points} XP
                                </Text>
                            </View>
                            <View style={[styles.podiumBase, { height: 40, backgroundColor: getMedalInfo(3).color + '30' }]}>
                                <Text style={[styles.rankNumber, { color: getMedalInfo(3).color }]}>3</Text>
                            </View>
                        </Animatable.View>
                    )}
                </Animatable.View>

                {/* Rest of the list */}
                <View style={styles.listContainer}>
                    {rest.map((student, index) => {
                        const isCurrentUser = student.username === currentUsername;
                        const rank = index + 4;

                        return (
                            <Animatable.View key={student.id} animation="fadeInUp" delay={800 + index * 100}>
                                <Card style={[styles.listItem, isCurrentUser && styles.currentUserItem]}>
                                    <Card.Content style={styles.listItemContent}>
                                        <Text style={styles.rankText}>{rank}</Text>
                                        <Avatar.Text
                                            size={44}
                                            label={student.username.substring(0, 2).toUpperCase()}
                                            style={{ backgroundColor: isCurrentUser ? theme.colors.primary : '#6C63FF20' }}
                                            labelStyle={{ color: isCurrentUser ? '#fff' : theme.colors.primary }}
                                        />
                                        <View style={styles.studentInfo}>
                                            <Text style={[styles.studentName, isCurrentUser && { color: theme.colors.primary }]}>
                                                {student.username} {isCurrentUser && '(You)'}
                                            </Text>
                                        </View>
                                        <View style={styles.xpBadge}>
                                            <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                                            <Text style={styles.xpText}>{student.total_points}</Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            </Animatable.View>
                        );
                    })}
                </View>
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
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    headerSubtitle: {
        color: '#636E72',
        marginTop: 4,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 30,
        height: 280,
    },
    podiumItem: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    podiumFirst: {
        marginBottom: 0,
    },
    podiumSecond: {
        marginBottom: 20,
    },
    podiumThird: {
        marginBottom: 40,
    },
    crown: {
        fontSize: 28,
        marginBottom: -8,
    },
    medal: {
        fontSize: 24,
        marginBottom: 8,
    },
    podiumName: {
        marginTop: 8,
        fontWeight: 'bold',
        color: '#2D3436',
        width: 80,
        textAlign: 'center',
        fontSize: 12,
    },
    pointsBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    pointsText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    pointsTextFirst: {
        fontSize: 14,
    },
    podiumBase: {
        width: 70,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        marginTop: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    listItem: {
        marginBottom: 10,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: '#fff',
    },
    currentUserItem: {
        borderWidth: 2,
        borderColor: '#6C63FF',
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        width: 30,
        color: '#636E72',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    studentName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    xpText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFB800',
    },
});
