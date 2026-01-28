import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl, ImageBackground } from 'react-native';
import { Text, ActivityIndicator, Title, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';

const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

const CATEGORY_ICONS = {
    'ICT': 'laptop',
    'Agriculture': 'sprout',
    'Industrial Arts': 'hammer-wrench',
    'Tourism': 'airplane',
};

export default function StudentProgressScreen({ navigation, route }) {
    const { studentId, studentName } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const result = await api.analytics.getStudentProgress(studentId);
            setData(result);
        } catch (error) {
            console.error('Error fetching student progress:', error);
            Alert.alert('Error', 'Failed to load student progress');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#00B894';
        if (score >= 60) return '#FDCB6E';
        return '#FF6B6B';
    };

    const getProgressWidth = (score) => `${Math.min(score, 100)}%`;

    if (loading) {
        return (
            <ImageBackground source={DASHBOARD_BG} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            </ImageBackground>
        );
    }

    if (!data) {
        return (
            <ImageBackground source={DASHBOARD_BG} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: '#fff' }}>Student not found</Text>
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <Animatable.View animation="fadeIn" style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Title style={styles.headerTitle}>{studentName}'s Progress</Title>
                        <Text style={styles.headerSubtitle}>
                            <MaterialCommunityIcons name="school" size={12} color="#6C63FF" /> {data.student?.section || 'No Section'}
                        </Text>
                    </View>
                </Animatable.View>

                {/* Overall Score Card */}
                <Animatable.View animation="fadeInUp" style={styles.overallCard}>
                    <View style={styles.overallTop}>
                        <Avatar.Text
                            size={64}
                            label={studentName?.substring(0, 2).toUpperCase() || '??'}
                            style={{ backgroundColor: getScoreColor(data.avgScore) }}
                        />
                        <View style={styles.overallInfo}>
                            <Text style={styles.overallLabel}>Overall Score</Text>
                            <Text style={[styles.overallScore, { color: getScoreColor(data.avgScore) }]}>
                                {data.avgScore}%
                            </Text>
                            <Text style={styles.overallMeta}>
                                <MaterialCommunityIcons name="clipboard-check" size={14} color="#636E72" /> {data.totalQuizzes} quizzes completed
                            </Text>
                        </View>
                    </View>
                    <View style={styles.overallBar}>
                        <View style={[styles.overallBarFill, { width: getProgressWidth(data.avgScore), backgroundColor: getScoreColor(data.avgScore) }]} />
                    </View>
                </Animatable.View>

                {/* Strengths & Weaknesses */}
                {(data.strengths.length > 0 || data.weaknesses.length > 0) && (
                    <View style={styles.insightsRow}>
                        {data.strengths.length > 0 && (
                            <Animatable.View animation="fadeInLeft" style={[styles.insightCard, styles.strengthCard]}>
                                <MaterialCommunityIcons name="star" size={24} color="#00B894" />
                                <Text style={styles.insightTitle}>Excels At</Text>
                                {data.strengths.map((cat) => (
                                    <View key={cat.name} style={styles.insightItem}>
                                        <MaterialCommunityIcons
                                            name={CATEGORY_ICONS[cat.name] || 'book'}
                                            size={14}
                                            color="#00B894"
                                        />
                                        <Text style={styles.insightItemText}>{cat.name}</Text>
                                        <Text style={styles.insightScore}>{cat.avgScore}%</Text>
                                    </View>
                                ))}
                            </Animatable.View>
                        )}
                        {data.weaknesses.length > 0 && (
                            <Animatable.View animation="fadeInRight" style={[styles.insightCard, styles.weaknessCard]}>
                                <MaterialCommunityIcons name="alert" size={24} color="#FF6B6B" />
                                <Text style={styles.insightTitle}>Needs Work</Text>
                                {data.weaknesses.map((cat) => (
                                    <View key={cat.name} style={styles.insightItem}>
                                        <MaterialCommunityIcons
                                            name={CATEGORY_ICONS[cat.name] || 'book'}
                                            size={14}
                                            color="#FF6B6B"
                                        />
                                        <Text style={styles.insightItemText}>{cat.name}</Text>
                                        <Text style={[styles.insightScore, { color: '#FF6B6B' }]}>{cat.avgScore}%</Text>
                                    </View>
                                ))}
                            </Animatable.View>
                        )}
                    </View>
                )}

                {/* Performance by Category */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="chart-bar" size={20} color="#fff" />
                        <Text style={styles.sectionTitle}>Performance by Subject</Text>
                    </View>

                    {data.categories.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="chart-line" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyText}>No quiz data yet</Text>
                        </View>
                    ) : (
                        data.categories.map((category, index) => (
                            <Animatable.View
                                key={category.name}
                                animation="fadeInUp"
                                delay={index * 100}
                                style={styles.categoryCard}
                            >
                                <View style={styles.categoryHeader}>
                                    <View style={styles.categoryLeft}>
                                        <View style={[styles.categoryIcon, { backgroundColor: getScoreColor(category.avgScore) }]}>
                                            <MaterialCommunityIcons
                                                name={CATEGORY_ICONS[category.name] || 'book'}
                                                size={20}
                                                color="#fff"
                                            />
                                        </View>
                                        <View>
                                            <Text style={styles.categoryName}>{category.name}</Text>
                                            <Text style={styles.categoryMeta}>{category.quizCount} quizzes • {category.passRate}% pass rate</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.categoryScore, { color: getScoreColor(category.avgScore) }]}>
                                        {category.avgScore}%
                                    </Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: getProgressWidth(category.avgScore),
                                                backgroundColor: getScoreColor(category.avgScore)
                                            }
                                        ]}
                                    />
                                </View>
                            </Animatable.View>
                        ))
                    )}
                </View>

                {/* Recent Quiz Results */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="history" size={20} color="#fff" />
                        <Text style={styles.sectionTitle}>Recent Quiz Results</Text>
                    </View>

                    {data.recentAttempts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="clipboard-text-off" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyText}>No quizzes taken yet</Text>
                        </View>
                    ) : (
                        data.recentAttempts.slice(0, 8).map((attempt, index) => (
                            <Animatable.View
                                key={`${attempt.quiz_id}-${index}`}
                                animation="fadeInUp"
                                delay={index * 50}
                                style={styles.quizItem}
                            >
                                <View style={styles.quizLeft}>
                                    <MaterialCommunityIcons
                                        name={attempt.score >= 70 ? 'check-circle' : 'close-circle'}
                                        size={24}
                                        color={attempt.score >= 70 ? '#00B894' : '#FF6B6B'}
                                    />
                                    <View style={styles.quizInfo}>
                                        <Text style={styles.quizTitle}>{attempt.quizzes?.title || 'Quiz'}</Text>
                                        <Text style={styles.quizCategory}>
                                            {attempt.quizzes?.topics?.lessons?.category || 'Unknown'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.quizScoreBadge, { backgroundColor: getScoreColor(attempt.score) }]}>
                                    <Text style={styles.quizScoreText}>{attempt.score}%</Text>
                                </View>
                            </Animatable.View>
                        ))
                    )}
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
    },
    backButton: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6C63FF',
        fontWeight: '600',
    },
    overallCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 20,
        marginBottom: 16,
    },
    overallTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    overallInfo: {
        marginLeft: 16,
        flex: 1,
    },
    overallLabel: {
        fontSize: 13,
        color: '#636E72',
    },
    overallScore: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    overallMeta: {
        fontSize: 12,
        color: '#636E72',
    },
    overallBar: {
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    overallBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    insightsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    insightCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        padding: 14,
    },
    strengthCard: {
        borderColor: '#00B894',
    },
    weaknessCard: {
        borderColor: '#FF6B6B',
    },
    insightTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2D3436',
        marginTop: 6,
        marginBottom: 8,
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    insightItemText: {
        flex: 1,
        fontSize: 12,
        color: '#636E72',
    },
    insightScore: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#00B894',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptyState: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.7)',
        marginTop: 12,
        textAlign: 'center',
    },
    categoryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        marginBottom: 10,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    categoryMeta: {
        fontSize: 11,
        color: '#636E72',
    },
    categoryScore: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    quizItem: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quizLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    quizInfo: {
        flex: 1,
    },
    quizTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    quizCategory: {
        fontSize: 11,
        color: '#636E72',
    },
    quizScoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    quizScoreText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
});
