import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { Title, Paragraph, Button, useTheme, Text, ActivityIndicator, Card, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Speech from 'expo-speech';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { width, height } = Dimensions.get('window');

// Parse content into sections (split by double newlines or headers)
const parseContentSections = (content) => {
    if (!content) return [];

    const sections = content.split(/\n\n+/).filter(s => s.trim());
    return sections.map((text, index) => ({
        id: index,
        text: text.trim(),
        understood: false
    }));
};

// Extract key points from content (sentences with key indicators)
const extractKeyPoints = (content) => {
    if (!content) return [];

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    // Take first 3-4 important sentences as key points
    return sentences.slice(0, 4).map(s => s.trim());
};

// Calculate reading time (average 200 words per minute)
const calculateReadingTime = (content) => {
    if (!content) return 1;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
};

// Extract keywords from content
const extractKeywords = (content) => {
    if (!content) return [];

    // Common important words in educational content
    const keywordPatterns = [
        /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
    ];

    const words = content.match(/\b\w{6,}\b/g) || [];
    const uniqueWords = [...new Set(words)].slice(0, 8);
    return uniqueWords;
};

export default function TopicScreen({ route, navigation }) {
    const { title, content, topicId, estimatedTime } = route.params || {
        title: 'Topic',
        content: 'No content available',
        topicId: null,
        estimatedTime: 5
    };

    const theme = useTheme();
    const { user } = useAuthStore();
    const scrollViewRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    // State
    const [quiz, setQuiz] = useState(null);
    const [loadingQuiz, setLoadingQuiz] = useState(true);
    const [hasReadContent, setHasReadContent] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [fontSize, setFontSize] = useState(16);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [sections, setSections] = useState([]);
    const [understoodSections, setUnderstoodSections] = useState({});
    const [showKeyPoints, setShowKeyPoints] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    const [readingXpEarned, setReadingXpEarned] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    const readingTime = calculateReadingTime(content);
    const keyPoints = extractKeyPoints(content);
    const keywords = extractKeywords(content);

    // Parse content into sections
    useEffect(() => {
        const parsedSections = parseContentSections(content);
        setSections(parsedSections);
    }, [content]);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (topicId) {
                try {
                    const quizData = await api.quizzes.getByTopicId(topicId);
                    setQuiz(quizData);
                } catch (error) {
                    console.error('Error fetching quiz:', error);
                }
            }
            setLoadingQuiz(false);
        };
        fetchQuiz();

        return () => {
            // Stop speech when leaving screen
            Speech.stop();
        };
    }, [topicId]);

    // Check if content is fully read
    useEffect(() => {
        if (scrollProgress >= 0.9) {
            setHasReadContent(true);
            if (!readingXpEarned) {
                setReadingXpEarned(true);
                // Award XP for reading (you can call API here)
            }
        }
    }, [scrollProgress]);

    // Handle scroll progress
    const handleScroll = useCallback((event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const progress = contentOffset.y / (contentSize.height - layoutMeasurement.height);
        setScrollProgress(Math.min(Math.max(progress, 0), 1));
    }, []);

    // Font size controls
    const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
    const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

    // Text-to-Speech
    const toggleSpeech = async () => {
        if (isSpeaking) {
            await Speech.stop();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            Speech.speak(content, {
                language: 'en',
                rate: 0.9,
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false)
            });
        }
    };

    // Toggle section understanding
    const toggleSectionUnderstood = (sectionId) => {
        setUnderstoodSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Calculate understanding progress
    const understandingProgress = sections.length > 0
        ? Object.values(understoodSections).filter(Boolean).length / sections.length
        : 0;

    const handleMarkComplete = async () => {
        if (user && topicId) {
            try {
                await api.topics.markComplete(user.id, topicId);
            } catch (error) {
                console.error('Error marking topic complete:', error);
            }
        }
        navigation.goBack();
    };

    const handleTakeQuiz = () => {
        if (!quiz) {
            Alert.alert('No Quiz', 'There is no quiz for this topic yet.');
            return;
        }
        Speech.stop();
        navigation.navigate('Quiz', {
            quizId: quiz.id,
            topicId: topicId,
            quizTitle: quiz.title,
            questions: quiz.quiz_questions
        });
    };

    // Progress bar width animation
    const progressBarWidth = scrollProgress * 100;

    return (
        <View style={[styles.container, focusMode && styles.focusModeContainer]}>
            {/* Scroll Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progressBarWidth}%`, backgroundColor: theme.colors.primary }]} />
            </View>

            {/* Top Controls */}
            {!focusMode && (
                <Animatable.View animation="fadeInDown" duration={400} style={styles.topControls}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
                    </TouchableOpacity>

                    <View style={styles.topRightControls}>
                        {/* Font Size Controls */}
                        <View style={styles.fontControls}>
                            <TouchableOpacity onPress={decreaseFontSize} style={styles.fontButton}>
                                <Text style={styles.fontButtonText}>A-</Text>
                            </TouchableOpacity>
                            <Text style={styles.fontSizeLabel}>{fontSize}</Text>
                            <TouchableOpacity onPress={increaseFontSize} style={styles.fontButton}>
                                <Text style={styles.fontButtonText}>A+</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Text-to-Speech */}
                        <TouchableOpacity
                            onPress={toggleSpeech}
                            style={[styles.ttsButton, isSpeaking && styles.ttsButtonActive]}
                        >
                            <MaterialCommunityIcons
                                name={isSpeaking ? "stop" : "volume-high"}
                                size={20}
                                color={isSpeaking ? "#fff" : theme.colors.primary}
                            />
                        </TouchableOpacity>

                        {/* Focus Mode */}
                        <TouchableOpacity
                            onPress={() => setFocusMode(!focusMode)}
                            style={styles.focusButton}
                        >
                            <MaterialCommunityIcons name="eye" size={20} color="#636E72" />
                        </TouchableOpacity>
                    </View>
                </Animatable.View>
            )}

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Header */}
                <View style={[styles.header, focusMode && styles.focusModeHeader]}>
                    {focusMode && (
                        <TouchableOpacity onPress={() => setFocusMode(false)} style={styles.exitFocusButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#636E72" />
                            <Text style={styles.exitFocusText}>Exit Focus Mode</Text>
                        </TouchableOpacity>
                    )}
                    <Title style={[styles.headerTitle, focusMode && styles.focusModeTitle]}>{title}</Title>

                    {/* Reading Info */}
                    <View style={styles.readingInfo}>
                        <View style={styles.readingBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#636E72" />
                            <Text style={styles.readingBadgeText}>{readingTime} min read</Text>
                        </View>
                        <View style={styles.readingBadge}>
                            <MaterialCommunityIcons name="format-text" size={14} color="#636E72" />
                            <Text style={styles.readingBadgeText}>{content?.split(/\s+/).length || 0} words</Text>
                        </View>
                        <View style={[styles.readingBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                            <Text style={[styles.readingBadgeText, { color: theme.colors.primary }]}>
                                {Math.round(scrollProgress * 100)}% read
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Key Points Summary (Collapsible) */}
                {keyPoints.length > 0 && !focusMode && (
                    <Animatable.View animation="fadeInUp" delay={100}>
                        <TouchableOpacity
                            onPress={() => setShowKeyPoints(!showKeyPoints)}
                            activeOpacity={0.8}
                        >
                            <Card style={styles.keyPointsCard}>
                                <Card.Content>
                                    <View style={styles.keyPointsHeader}>
                                        <View style={styles.keyPointsTitleRow}>
                                            <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#FFB800" />
                                            <Text style={styles.keyPointsTitle}>Key Points</Text>
                                        </View>
                                        <MaterialCommunityIcons
                                            name={showKeyPoints ? "chevron-up" : "chevron-down"}
                                            size={24}
                                            color="#636E72"
                                        />
                                    </View>

                                    {showKeyPoints && (
                                        <Animatable.View animation="fadeIn" duration={300}>
                                            {keyPoints.map((point, index) => (
                                                <View key={index} style={styles.keyPointItem}>
                                                    <MaterialCommunityIcons name="check-circle" size={16} color="#00B894" />
                                                    <Text style={styles.keyPointText}>{point}.</Text>
                                                </View>
                                            ))}
                                        </Animatable.View>
                                    )}
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    </Animatable.View>
                )}

                {/* Content Sections with Checkpoints */}
                <Animatable.View animation="fadeInUp" delay={200}>
                    <Card style={[styles.contentCard, focusMode && styles.focusModeCard]}>
                        <Card.Content>
                            {sections.map((section, index) => (
                                <View key={section.id} style={styles.sectionContainer}>
                                    <Paragraph style={[styles.content, { fontSize, lineHeight: fontSize * 1.6 }]}>
                                        {section.text}
                                    </Paragraph>

                                    {/* "I Understand" Checkpoint */}
                                    {!focusMode && index < sections.length - 1 && (
                                        <TouchableOpacity
                                            onPress={() => toggleSectionUnderstood(section.id)}
                                            style={[
                                                styles.checkpointButton,
                                                understoodSections[section.id] && styles.checkpointButtonActive
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={understoodSections[section.id] ? "check-circle" : "circle-outline"}
                                                size={18}
                                                color={understoodSections[section.id] ? "#00B894" : "#B2BEC3"}
                                            />
                                            <Text style={[
                                                styles.checkpointText,
                                                understoodSections[section.id] && styles.checkpointTextActive
                                            ]}>
                                                {understoodSections[section.id] ? "Got it!" : "I understand this section"}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {index < sections.length - 1 && (
                                        <View style={styles.sectionDivider} />
                                    )}
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                </Animatable.View>

                {/* Keywords */}
                {keywords.length > 0 && !focusMode && (
                    <Animatable.View animation="fadeInUp" delay={300} style={styles.keywordsContainer}>
                        <Text style={styles.keywordsTitle}>Important Terms</Text>
                        <View style={styles.keywordsRow}>
                            {keywords.map((keyword, index) => (
                                <Chip
                                    key={index}
                                    style={styles.keywordChip}
                                    textStyle={styles.keywordText}
                                >
                                    {keyword}
                                </Chip>
                            ))}
                        </View>
                    </Animatable.View>
                )}

                {/* Understanding Progress */}
                {sections.length > 1 && !focusMode && (
                    <Animatable.View animation="fadeInUp" delay={400} style={styles.understandingContainer}>
                        <View style={styles.understandingHeader}>
                            <Text style={styles.understandingTitle}>Your Understanding</Text>
                            <Text style={[styles.understandingPercent, { color: theme.colors.primary }]}>
                                {Math.round(understandingProgress * 100)}%
                            </Text>
                        </View>
                        <View style={styles.understandingBar}>
                            <View style={[
                                styles.understandingProgress,
                                { width: `${understandingProgress * 100}%`, backgroundColor: '#00B894' }
                            ]} />
                        </View>
                    </Animatable.View>
                )}

                {/* XP Earned for Reading */}
                {readingXpEarned && !focusMode && (
                    <Animatable.View animation="bounceIn" style={styles.xpEarnedBanner}>
                        <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                        <Text style={styles.xpEarnedText}>+50 XP for reading!</Text>
                    </Animatable.View>
                )}

                {/* Action Buttons */}
                {!focusMode && (
                    <Animatable.View animation="fadeInUp" delay={500} style={styles.buttonContainer}>
                        {loadingQuiz ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : quiz ? (
                            <View>
                                <Button
                                    mode="contained"
                                    onPress={handleTakeQuiz}
                                    disabled={!hasReadContent}
                                    style={[styles.button, !hasReadContent && styles.disabledButton]}
                                    icon="brain"
                                    contentStyle={styles.buttonContent}
                                >
                                    {hasReadContent ? 'Take Quiz' : `Scroll to finish reading (${Math.round(scrollProgress * 100)}%)`}
                                </Button>
                                {hasReadContent && (
                                    <View style={styles.quizXpPreview}>
                                        <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                                        <Text style={styles.quizXpText}>Earn up to 200 XP on the quiz!</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <Button
                                mode="contained"
                                onPress={handleMarkComplete}
                                style={[styles.button, { backgroundColor: '#00B894' }]}
                                icon="check-circle"
                                contentStyle={styles.buttonContent}
                            >
                                Mark as Complete
                            </Button>
                        )}
                    </Animatable.View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    focusModeContainer: {
        backgroundColor: '#1A1A2E',
    },
    progressBarContainer: {
        height: 3,
        backgroundColor: '#E0E0E0',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    progressBar: {
        height: '100%',
        borderRadius: 1.5,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 8,
    },
    topRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fontControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 4,
    },
    fontButton: {
        padding: 8,
    },
    fontButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#636E72',
    },
    fontSizeLabel: {
        fontSize: 12,
        color: '#636E72',
        marginHorizontal: 4,
    },
    ttsButton: {
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    },
    ttsButtonActive: {
        backgroundColor: '#6C63FF',
    },
    focusButton: {
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 16,
    },
    focusModeHeader: {
        paddingTop: 60,
    },
    exitFocusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    exitFocusText: {
        color: '#636E72',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
    },
    focusModeTitle: {
        color: '#F8F9FA',
    },
    readingInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    readingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    readingBadgeText: {
        fontSize: 12,
        color: '#636E72',
    },
    keyPointsCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#FFF9E6',
        elevation: 0,
    },
    keyPointsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    keyPointsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    keyPointsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    keyPointItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        gap: 8,
    },
    keyPointText: {
        flex: 1,
        fontSize: 14,
        color: '#2D3436',
        lineHeight: 20,
    },
    contentCard: {
        marginHorizontal: 20,
        borderRadius: 16,
        elevation: 2,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    focusModeCard: {
        backgroundColor: '#16213E',
        elevation: 0,
    },
    sectionContainer: {
        marginBottom: 8,
    },
    content: {
        color: '#2D3436',
    },
    checkpointButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        gap: 6,
    },
    checkpointButtonActive: {
        backgroundColor: '#E8F8F5',
    },
    checkpointText: {
        fontSize: 13,
        color: '#B2BEC3',
    },
    checkpointTextActive: {
        color: '#00B894',
        fontWeight: '600',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 16,
    },
    keywordsContainer: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    keywordsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636E72',
        marginBottom: 10,
    },
    keywordsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    keywordChip: {
        backgroundColor: '#F0EEFF',
    },
    keywordText: {
        fontSize: 12,
        color: '#6C63FF',
    },
    understandingContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    understandingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    understandingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636E72',
    },
    understandingPercent: {
        fontWeight: 'bold',
    },
    understandingBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    understandingProgress: {
        height: '100%',
        borderRadius: 4,
    },
    xpEarnedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#FFF9E6',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    xpEarnedText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFB800',
    },
    buttonContainer: {
        paddingHorizontal: 20,
    },
    button: {
        borderRadius: 12,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    disabledButton: {
        backgroundColor: '#B2BEC3',
    },
    quizXpPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 6,
    },
    quizXpText: {
        fontSize: 13,
        color: '#FFB800',
        fontWeight: '600',
    },
});
