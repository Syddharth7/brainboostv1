import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Animated, Dimensions, Platform, ImageBackground } from 'react-native';
import { Title, Paragraph, Button, useTheme, Text, ActivityIndicator, Card, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Speech from 'expo-speech';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { width, height } = Dimensions.get('window');

// Background image
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

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

    // Look for sentences that contain key learning indicators
    const keyIndicators = ['important', 'key', 'remember', 'note', 'essential', 'must', 'always', 'never', 'definition', 'means', 'refers to', 'is called', 'is known as'];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);

    const keyPoints = sentences.filter(s =>
        keyIndicators.some(indicator => s.toLowerCase().includes(indicator))
    ).slice(0, 5);

    // If no key indicators found, take first 3-4 sentences as key points
    if (keyPoints.length === 0) {
        return sentences.slice(0, 4).map(s => s.trim());
    }

    return keyPoints.map(s => s.trim());
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

    const words = content.match(/\b\w{6,}\b/g) || [];
    const uniqueWords = [...new Set(words)].slice(0, 8);
    return uniqueWords;
};

// Clean content for text-to-speech (remove HTML, markdown, special chars)
const cleanContentForSpeech = (content) => {
    if (!content) return '';

    let cleaned = content;

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, ' ');

    // Remove markdown headers (#, ##, ###)
    cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');

    // Remove markdown bold/italic (**text**, *text*, __text__, _text_)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

    // Remove markdown links [text](url)
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove markdown code blocks and inline code
    cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    // Remove bullet points and list markers
    cleaned = cleaned.replace(/^[\s]*[-*•]\s*/gm, '');
    cleaned = cleaned.replace(/^\d+\.\s*/gm, '');

    // Remove emojis (common emoji unicode ranges)
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');

    // Remove multiple spaces and newlines
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Trim and limit length (TTS has limits)
    cleaned = cleaned.trim();
    if (cleaned.length > 5000) {
        cleaned = cleaned.substring(0, 5000) + '...';
    }

    return cleaned;
};

export default function TopicScreen({ route, navigation }) {
    const { title, content, topicId, estimatedTime, topicOrder = 1 } = route.params || {
        title: 'Topic',
        content: 'No content available',
        topicId: null,
        estimatedTime: 5,
        topicOrder: 1
    };

    const theme = useTheme();
    const { user } = useAuthStore();
    const scrollViewRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const hasSpeechStartedRef = useRef(false); // Track if speech already started

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
    const [xpResult, setXpResult] = useState(null);
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
    }, [topicId]);

    // Separate useEffect for TTS - with chunking for long content
    useEffect(() => {
        if (!content) {
            console.log('TTS: No content!');
            return;
        }

        console.log('TTS: Content received, length:', content.length);
        let isCancelled = false;

        // Function to split content into chunks at sentence boundaries
        const splitIntoChunks = (text, maxLength = 2000) => {
            const chunks = [];
            let remaining = text;

            while (remaining.length > 0) {
                if (remaining.length <= maxLength) {
                    chunks.push(remaining);
                    break;
                }

                // Find a good break point (end of sentence)
                let breakPoint = remaining.lastIndexOf('. ', maxLength);
                if (breakPoint === -1 || breakPoint < maxLength / 2) {
                    breakPoint = remaining.lastIndexOf(' ', maxLength);
                }
                if (breakPoint === -1) {
                    breakPoint = maxLength;
                }

                chunks.push(remaining.substring(0, breakPoint + 1).trim());
                remaining = remaining.substring(breakPoint + 1).trim();
            }

            return chunks;
        };

        // Function to speak chunks sequentially
        const speakChunks = (chunks, index = 0) => {
            if (isCancelled || index >= chunks.length) {
                console.log('TTS: All chunks done');
                setIsSpeaking(false);
                return;
            }

            console.log(`TTS: Speaking chunk ${index + 1}/${chunks.length}, length: ${chunks[index].length}`);

            Speech.speak(chunks[index], {
                language: 'en',
                rate: 0.85,
                onDone: () => {
                    if (!isCancelled) {
                        speakChunks(chunks, index + 1);
                    }
                },
                onStopped: () => {
                    console.log('TTS: Stopped by user');
                    setIsSpeaking(false);
                },
                onError: (err) => {
                    console.log('TTS: Chunk error:', err);
                    // Try next chunk anyway
                    speakChunks(chunks, index + 1);
                }
            });
        };

        // Start TTS after delay
        const testTimer = setTimeout(() => {
            if (isCancelled) return;

            const cleanedContent = cleanContentForSpeech(content);
            console.log('TTS: Cleaned content length:', cleanedContent.length);

            if (cleanedContent && cleanedContent.length > 0) {
                setIsSpeaking(true);
                const chunks = splitIntoChunks(cleanedContent);
                console.log(`TTS: Split into ${chunks.length} chunks`);
                speakChunks(chunks);
            } else {
                console.log('TTS: Cleaned content is empty!');
            }
        }, 500);

        return () => {
            isCancelled = true;
            clearTimeout(testTimer);
            Speech.stop();
        };
    }, [content]);

    // Check if content is fully read and award XP
    useEffect(() => {
        if (scrollProgress >= 0.9) {
            setHasReadContent(true);
            if (!readingXpEarned && user) {
                setReadingXpEarned(true);
                // Award XP for reading the topic
                const awardXP = async () => {
                    try {
                        const result = await api.xp.awardTopicXP(user.id, topicOrder);
                        setXpResult(result);
                        console.log('XP awarded:', result);
                    } catch (error) {
                        console.error('Error awarding XP:', error);
                    }
                };
                awardXP();
            }
        }
    }, [scrollProgress, readingXpEarned, user, topicOrder]);

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
            const cleanedContent = cleanContentForSpeech(content);
            if (cleanedContent) {
                setIsSpeaking(true);
                Speech.speak(cleanedContent, {
                    language: 'en',
                    rate: 0.9,
                    onDone: () => setIsSpeaking(false),
                    onStopped: () => setIsSpeaking(false),
                    onError: (error) => {
                        console.error('TTS Error:', error);
                        setIsSpeaking(false);
                    }
                });
            }
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
            questions: quiz.quiz_questions,
            topicOrder: topicOrder
        });
    };

    // Progress bar width animation
    const progressBarWidth = scrollProgress * 100;

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            {/* Scroll Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progressBarWidth}%` }]} />
            </View>

            {/* Top Controls */}
            <Animatable.View animation="fadeInDown" duration={400} style={styles.topControls}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonCircle}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#2D3436" />
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
                            size={18}
                            color={isSpeaking ? "#fff" : "#6C63FF"}
                        />
                    </TouchableOpacity>
                </View>
            </Animatable.View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Header */}
                <View style={styles.header}>
                    {/* Title Badge */}
                    <View style={styles.titleBadge}>
                        <MaterialCommunityIcons name="book-open-page-variant" size={18} color="#6C63FF" style={{ marginRight: 8 }} />
                        <Text style={styles.titleBadgeText}>{title}</Text>
                    </View>

                    {/* Reading Info */}
                    <View style={styles.readingInfo}>
                        <View style={styles.readingBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color="#fff" />
                            <Text style={styles.readingBadgeText}>{readingTime} min read</Text>
                        </View>
                        <View style={styles.readingBadge}>
                            <MaterialCommunityIcons name="format-text" size={12} color="#fff" />
                            <Text style={styles.readingBadgeText}>{content?.split(/\s+/).length || 0} words</Text>
                        </View>
                        <View style={[styles.readingBadge, styles.progressBadge]}>
                            <Text style={styles.progressBadgeText}>
                                {Math.round(scrollProgress * 100)}% read
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Blackboard Content Card */}
                <Animatable.View animation="fadeInUp" delay={200} style={styles.blackboardContainer}>
                    {/* Wooden Frame Top */}
                    <View style={styles.woodenFrameTop} />

                    {/* Blackboard */}
                    <View style={styles.blackboard}>
                        {/* Chalk Dust Effect */}
                        <View style={styles.chalkDust} />

                        {/* Key Learning Points */}
                        {keyPoints.length > 0 && (
                            <View style={styles.keyPointsSection}>
                                <Text style={styles.keyPointsHeader}>📚 Key Learning Points</Text>
                                {keyPoints.map((point, idx) => (
                                    <View key={idx} style={styles.keyPointItem}>
                                        <MaterialCommunityIcons name="star" size={14} color="#FFD93D" />
                                        <Text style={styles.keyPointText}>{point}.</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Content Sections */}
                        {sections.map((section, index) => (
                            <View key={section.id} style={styles.sectionContainer}>
                                <Text style={[styles.chalkText, { fontSize, lineHeight: fontSize * 1.8 }]}>
                                    {section.text}
                                </Text>

                                {/* "I Understand" Checkpoint */}
                                {index < sections.length - 1 && (
                                    <TouchableOpacity
                                        onPress={() => toggleSectionUnderstood(section.id)}
                                        style={[
                                            styles.checkpointButton,
                                            understoodSections[section.id] && styles.checkpointButtonActive
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={understoodSections[section.id] ? "check-circle" : "circle-outline"}
                                            size={16}
                                            color={understoodSections[section.id] ? "#4ADE80" : "rgba(255,255,255,0.5)"}
                                        />
                                        <Text style={[
                                            styles.checkpointText,
                                            understoodSections[section.id] && styles.checkpointTextActive
                                        ]}>
                                            {understoodSections[section.id] ? "Got it! ✓" : "I understand this section"}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {index < sections.length - 1 && (
                                    <View style={styles.sectionDivider} />
                                )}
                            </View>
                        ))}

                        {/* Chalk Tray */}
                        <View style={styles.chalkTray}>
                            <View style={[styles.chalkPiece, { backgroundColor: '#FFFFFF' }]} />
                            <View style={[styles.chalkPiece, { backgroundColor: '#FFD93D' }]} />
                            <View style={[styles.chalkPiece, { backgroundColor: '#FF6B6B' }]} />
                            <View style={[styles.chalkPiece, { backgroundColor: '#4ADE80' }]} />
                        </View>
                    </View>

                    {/* Wooden Frame Bottom */}
                    <View style={styles.woodenFrameBottom} />
                </Animatable.View>

                {/* Understanding Progress */}
                {sections.length > 1 && (
                    <Animatable.View animation="fadeInUp" delay={400} style={styles.understandingCard}>
                        <View style={styles.understandingHeader}>
                            <Text style={styles.understandingTitle}>📊 Your Understanding</Text>
                            <Text style={styles.understandingPercent}>
                                {Math.round(understandingProgress * 100)}%
                            </Text>
                        </View>
                        <View style={styles.understandingBar}>
                            <View style={[
                                styles.understandingProgress,
                                { width: `${understandingProgress * 100}%` }
                            ]} />
                        </View>
                    </Animatable.View>
                )}

                {/* XP Earned for Reading */}
                {readingXpEarned && xpResult && (
                    <Animatable.View animation="bounceIn" style={styles.xpEarnedBanner}>
                        <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                        <Text style={styles.xpEarnedText}>+{xpResult.xpAwarded} XP for reading!</Text>
                        {xpResult.leveledUp && (
                            <Text style={styles.levelUpText}> 🎉 Level Up!</Text>
                        )}
                    </Animatable.View>
                )}

                {/* Action Button */}
                <Animatable.View animation="fadeInUp" delay={500} style={styles.buttonContainer}>
                    {loadingQuiz ? (
                        <ActivityIndicator size="small" color="#6C63FF" />
                    ) : quiz ? (
                        <View>
                            <TouchableOpacity
                                onPress={handleTakeQuiz}
                                disabled={!hasReadContent}
                                style={[styles.quizButton, !hasReadContent && styles.disabledButton]}
                            >
                                <MaterialCommunityIcons name="brain" size={22} color="#fff" />
                                <Text style={styles.quizButtonText}>
                                    {hasReadContent ? 'Take Quiz' : `Scroll to finish reading (${Math.round(scrollProgress * 100)}%)`}
                                </Text>
                            </TouchableOpacity>
                            {hasReadContent && (
                                <View style={styles.quizXpPreview}>
                                    <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                                    <Text style={styles.quizXpText}>Earn up to 200 XP on the quiz!</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handleMarkComplete}
                            style={[styles.quizButton, { backgroundColor: '#00B894' }]}
                        >
                            <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                            <Text style={styles.quizButtonText}>Mark as Complete</Text>
                        </TouchableOpacity>
                    )}
                </Animatable.View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#6C63FF',
        borderRadius: 2,
    },
    // Top Controls
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 55,
        paddingBottom: 12,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fontControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingHorizontal: 4,
    },
    fontButton: {
        padding: 8,
    },
    fontButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    fontSizeLabel: {
        fontSize: 11,
        color: '#636E72',
        marginHorizontal: 4,
    },
    ttsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ttsButtonActive: {
        backgroundColor: '#6C63FF',
        borderColor: '#6C63FF',
    },
    scrollView: {
        flex: 1,
    },
    // Header
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    titleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#2D3436',
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    titleBadgeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    readingInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    readingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    readingBadgeText: {
        fontSize: 11,
        color: '#fff',
    },
    progressBadge: {
        backgroundColor: '#6C63FF',
    },
    progressBadgeText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: 'bold',
    },
    // Blackboard
    blackboardContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    woodenFrameTop: {
        height: 14,
        backgroundColor: '#8B4513',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: '#5D2E0C',
    },
    woodenFrameBottom: {
        height: 18,
        backgroundColor: '#8B4513',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderWidth: 2,
        borderTopWidth: 0,
        borderColor: '#5D2E0C',
    },
    blackboard: {
        backgroundColor: '#2C5530',
        padding: 20,
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderColor: '#8B4513',
        minHeight: 200,
    },
    chalkDust: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 1,
    },
    // Key Points Section
    keyPointsSection: {
        backgroundColor: 'rgba(255, 217, 61, 0.15)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#FFD93D',
        borderStyle: 'dashed',
    },
    keyPointsHeader: {
        color: '#FFD93D',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    keyPointItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    keyPointText: {
        flex: 1,
        color: '#FFD93D',
        fontSize: 14,
        lineHeight: 20,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    sectionContainer: {
        marginBottom: 8,
    },
    chalkText: {
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textShadowColor: 'rgba(255, 255, 255, 0.3)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
    },
    checkpointButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dashed',
        gap: 6,
    },
    checkpointButtonActive: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        borderColor: '#4ADE80',
        borderStyle: 'solid',
    },
    checkpointText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    checkpointTextActive: {
        color: '#4ADE80',
        fontWeight: '600',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginVertical: 16,
    },
    chalkTray: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        gap: 12,
    },
    chalkPiece: {
        width: 28,
        height: 7,
        borderRadius: 3,
        transform: [{ rotate: '-5deg' }],
    },
    // Understanding Card
    understandingCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        padding: 16,
    },
    understandingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    understandingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    understandingPercent: {
        fontWeight: 'bold',
        color: '#6C63FF',
    },
    understandingBar: {
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    understandingProgress: {
        height: '100%',
        backgroundColor: '#00B894',
        borderRadius: 5,
    },
    // XP Banner
    xpEarnedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingVertical: 14,
        gap: 8,
    },
    xpEarnedText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFB800',
    },
    levelUpText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00B894',
    },
    // Button
    buttonContainer: {
        paddingHorizontal: 16,
    },
    quizButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        gap: 10,
    },
    quizButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
