import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { List, Title, ProgressBar, ActivityIndicator, useTheme, Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useIsFocused } from '@react-navigation/native';

export default function LessonDetailScreen({ route, navigation }) {
    const { lessonId, title } = route.params;
    const theme = useTheme();
    const { user } = useAuthStore();
    const isFocused = useIsFocused();

    const [topics, setTopics] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [topicQuizzes, setTopicQuizzes] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const topicsData = await api.topics.getByLessonId(lessonId);
            setTopics(topicsData);

            const quizMap = {};
            await Promise.all(topicsData.map(async (topic) => {
                try {
                    const quiz = await api.quizzes.getByTopicId(topic.id);
                    if (quiz) {
                        quizMap[topic.id] = quiz;
                    }
                } catch (e) {
                    console.log('No quiz for topic:', topic.id);
                }
            }));
            setTopicQuizzes(quizMap);

            const attempts = await api.progress.getUserQuizProgress(user.id);
            setQuizAttempts(attempts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [lessonId, isFocused]);

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const passedQuizIds = quizAttempts.filter(a => a.score >= 70).map(a => a.quiz_id);

    const topicsWithStatus = topics.map((topic, index) => {
        const quiz = topicQuizzes[topic.id];
        const prevTopic = index > 0 ? topics[index - 1] : null;
        const prevQuiz = prevTopic ? topicQuizzes[prevTopic.id] : null;

        let isUnlocked = index === 0;
        if (index > 0 && prevQuiz && passedQuizIds.includes(prevQuiz.id)) {
            isUnlocked = true;
        }

        const isCompleted = quiz && passedQuizIds.includes(quiz.id);

        return { ...topic, isLocked: !isUnlocked, isCompleted, quiz };
    });

    const completedTopics = topicsWithStatus.filter(t => t.isCompleted).length;
    const progressPercentage = topics.length > 0 ? completedTopics / topics.length : 0;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <Title style={styles.headerTitle}>{title}</Title>
                    <Text style={styles.headerSubtitle}>
                        {topics.length} Topics • {completedTopics}/{topics.length} Completed
                    </Text>

                    {/* Progress Card */}
                    <Card style={styles.progressCard}>
                        <Card.Content>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Progress</Text>
                                <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
                                    {Math.round(progressPercentage * 100)}%
                                </Text>
                            </View>
                            <ProgressBar progress={progressPercentage || 0} color={theme.colors.primary} style={styles.progressBar} />
                        </Card.Content>
                    </Card>
                </Animatable.View>

                {/* Topics List */}
                <View style={styles.content}>
                    <Title style={styles.sectionTitle}>Topics</Title>
                    {topicsWithStatus.map((topic, index) => {
                        const isLast = index === topicsWithStatus.length - 1;

                        return (
                            <Animatable.View key={topic.id} animation="fadeInUp" delay={index * 100}>
                                <View style={styles.topicRow}>
                                    {/* Path Line & Node */}
                                    <View style={styles.pathNodeContainer}>
                                        <View style={[
                                            styles.pathNode,
                                            topic.isCompleted && styles.completedNode,
                                            topic.isLocked && styles.lockedNode,
                                            !topic.isCompleted && !topic.isLocked && styles.activeNode
                                        ]}>
                                            {topic.isCompleted ? (
                                                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                                            ) : topic.isLocked ? (
                                                <MaterialCommunityIcons name="lock" size={12} color="#B2BEC3" />
                                            ) : (
                                                <Text style={styles.nodeNumber}>{index + 1}</Text>
                                            )}
                                        </View>
                                        {!isLast && (
                                            <View style={[
                                                styles.pathLine,
                                                topic.isCompleted && styles.completedLine
                                            ]} />
                                        )}
                                    </View>

                                    {/* Topic Card */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (topic.isLocked) {
                                                Alert.alert('Locked', 'Pass the previous topic\'s quiz to unlock this topic.');
                                            } else {
                                                navigation.navigate('Topic', {
                                                    topicId: topic.id,
                                                    title: topic.title,
                                                    content: topic.content,
                                                    topicOrder: topic.order || (index + 1)
                                                });
                                            }
                                        }}
                                        activeOpacity={0.7}
                                        disabled={topic.isLocked}
                                        style={styles.topicCardContainer}
                                    >
                                        <Card style={[
                                            styles.topicCard,
                                            topic.isLocked && styles.lockedCard,
                                            topic.isCompleted && styles.completedCard
                                        ]}>
                                            <Card.Content style={styles.topicContent}>
                                                <View style={styles.topicInfo}>
                                                    <Title style={[styles.topicTitle, topic.isLocked && styles.lockedText]}>
                                                        {topic.title}
                                                    </Title>
                                                    <View style={styles.topicMeta}>
                                                        <View style={styles.metaItem}>
                                                            <MaterialCommunityIcons name="clock-outline" size={14} color="#636E72" />
                                                            <Text style={styles.metaText}>{topic.estimated_time} mins</Text>
                                                        </View>
                                                        {topic.quiz && (
                                                            <View style={[styles.quizBadge, topic.isCompleted && { backgroundColor: '#E8F8F5' }]}>
                                                                <MaterialCommunityIcons
                                                                    name={topic.isCompleted ? "check-circle" : "brain"}
                                                                    size={12}
                                                                    color={topic.isCompleted ? "#00B894" : "#6C63FF"}
                                                                />
                                                                <Text style={[styles.quizBadgeText, topic.isCompleted && { color: '#00B894' }]}>
                                                                    {topic.isCompleted ? 'Passed' : 'Has Quiz'}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <MaterialCommunityIcons
                                                    name={topic.isLocked ? "lock" : (topic.isCompleted ? "check-circle" : "chevron-right")}
                                                    size={24}
                                                    color={topic.isCompleted ? '#00B894' : (topic.isLocked ? '#B2BEC3' : theme.colors.primary)}
                                                />
                                            </Card.Content>
                                        </Card>
                                    </TouchableOpacity>
                                </View>
                            </Animatable.View>
                        );
                    })}

                    {completedTopics === topics.length && topics.length > 0 && (
                        <Animatable.View animation="bounceIn" delay={500}>
                            <Card style={styles.completionCard}>
                                <Card.Content style={styles.completionContent}>
                                    <Text style={styles.completionEmoji}>🎉</Text>
                                    <View style={styles.completionInfo}>
                                        <Text style={styles.completionTitle}>Lesson Complete!</Text>
                                        <Text style={styles.completionText}>You've mastered all topics!</Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        </Animatable.View>
                    )}
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
        paddingTop: 50,
    },
    backButton: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    headerSubtitle: {
        color: '#636E72',
        marginBottom: 16,
    },
    progressCard: {
        borderRadius: 12,
        elevation: 2,
        backgroundColor: '#fff',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        color: '#636E72',
        fontSize: 12,
    },
    progressPercent: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    content: {
        padding: 20,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2D3436',
    },
    topicRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    pathNodeContainer: {
        width: 36,
        alignItems: 'center',
    },
    pathNode: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    completedNode: {
        backgroundColor: '#00B894',
    },
    lockedNode: {
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    activeNode: {
        backgroundColor: '#6C63FF',
    },
    nodeNumber: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    pathLine: {
        width: 3,
        flex: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 4,
    },
    completedLine: {
        backgroundColor: '#00B894',
    },
    topicCardContainer: {
        flex: 1,
        marginLeft: 12,
    },
    topicCard: {
        borderRadius: 12,
        elevation: 2,
        backgroundColor: '#fff',
    },
    lockedCard: {
        opacity: 0.6,
    },
    completedCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#00B894',
    },
    topicContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topicInfo: {
        flex: 1,
    },
    topicTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 8,
    },
    lockedText: {
        color: '#B2BEC3',
    },
    topicMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#636E72',
    },
    quizBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0EEFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    quizBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6C63FF',
    },
    completionCard: {
        marginTop: 20,
        borderRadius: 16,
        backgroundColor: '#E8F8F5',
        elevation: 0,
    },
    completionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    completionEmoji: {
        fontSize: 40,
        marginRight: 16,
    },
    completionInfo: {},
    completionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00B894',
    },
    completionText: {
        color: '#636E72',
        marginTop: 2,
    },
});
