import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, ImageBackground, Image, Animated, Easing } from 'react-native';
import { Title, Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

// Images
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');
const LOGO_IMAGE = require('../../assets/images/logo.png');
const WELCOME_IMAGE = require('../../assets/images/welcome_text.png');
const LESSONS_CARD_IMAGE = require('../../assets/images/lessons_card.jpg');
const QUIZ_CARD_IMAGE = require('../../assets/images/quiz_card.jpg');

// Format date helper
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

// Floating Card Component with animation
const FloatingCard = ({ children, delay = 0, style }) => {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: -8,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        const timeout = setTimeout(startAnimation, delay);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <Animated.View style={[style, { transform: [{ translateY: floatAnim }] }]}>
            {children}
        </Animated.View>
    );
};

// Analytics Card Component
const AnalyticsCard = ({ strugglingLessons }) => (
    <Animatable.View animation="fadeInUp" delay={400}>
        <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,245,245,0.95)']}
            style={styles.analyticsCard}
        >
            <View style={styles.analyticsHeader}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#FF6B6B" />
                <Text style={styles.analyticsTitle}>Areas to Improve</Text>
            </View>

            {strugglingLessons.length > 0 ? (
                strugglingLessons.map((lesson, index) => (
                    <View key={index} style={styles.struggleItem}>
                        <View style={styles.struggleIcon}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color="#FF6B6B" />
                        </View>
                        <View style={styles.struggleInfo}>
                            <Text style={styles.struggleName}>{lesson.name}</Text>
                            <Text style={styles.struggleScore}>Score: {lesson.score}%</Text>
                        </View>
                        <TouchableOpacity style={styles.reviewButton}>
                            <Text style={styles.reviewButtonText}>Review</Text>
                        </TouchableOpacity>
                    </View>
                ))
            ) : (
                <View style={styles.noStruggleContainer}>
                    <Text style={styles.noStruggleEmoji}>🎉</Text>
                    <Text style={styles.noStruggleText}>Great job! No struggling areas found.</Text>
                </View>
            )}
        </LinearGradient>
    </Animatable.View>
);

// Notification Bubble Announcement Item Component
const AnnouncementItem = ({ announcement, index }) => {
    // Icons based on announcement type
    const getIcon = () => {
        if (announcement.title.toLowerCase().includes('lesson')) return 'book-open-variant';
        if (announcement.title.toLowerCase().includes('quiz')) return 'head-question';
        if (announcement.title.toLowerCase().includes('holiday')) return 'calendar';
        return 'bullhorn';
    };

    return (
        <Animatable.View animation="fadeInUp" delay={400 + (index * 100)} style={styles.announcementWrapper}>
            {/* Speech bubble pointer */}
            <View style={styles.speechPointer} />

            <View style={styles.announcementItem}>
                <View style={styles.announcementIcon}>
                    <MaterialCommunityIcons
                        name={getIcon()}
                        size={24}
                        color="#2D3436"
                    />
                </View>
                <View style={styles.announcementContent}>
                    <Text style={styles.announcementTitle}>
                        <Text style={styles.teacherName}>{announcement.teacher_name || 'Teacher'}</Text>
                        {' '}{announcement.title.toLowerCase()}
                    </Text>
                    <Text style={styles.announcementMessage} numberOfLines={1}>
                        {announcement.message}
                    </Text>
                    <Text style={styles.announcementDate}>{formatDate(announcement.created_at)}</Text>
                </View>
            </View>
        </Animatable.View>
    );
};

export default function DashboardScreen({ navigation }) {
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [strugglingLessons, setStrugglingLessons] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [userXP, setUserXP] = useState({ xp: 0, level: 1 });

    const username = user?.user_metadata?.username || 'Student';

    const fetchData = async () => {
        try {
            // Fetch XP and level
            try {
                const xpData = await api.xp.getUserXP(user.id);
                setUserXP(xpData);
            } catch (xpError) {
                console.error('Error fetching XP:', xpError);
            }

            // Fetch real announcements
            try {
                const announcementsData = await api.announcements.getAll();
                setAnnouncements(announcementsData || []);
            } catch (annError) {
                console.error('Error fetching announcements:', annError);
            }

            const quizProgress = await api.progress.getUserQuizProgress(user.id);
            const struggling = quizProgress
                .filter(p => p.score < 70)
                .map(p => ({
                    name: p.quiz?.title || 'Unknown Lesson',
                    score: p.score
                }))
                .slice(0, 3);

            setStrugglingLessons(struggling);
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            {/* Notification Bell Icon */}
            <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
                <View style={styles.notificationIconContainer}>
                    <MaterialCommunityIcons name="bell-outline" size={26} color="#2D3436" />
                    <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>3</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo - No Border */}
                <Animatable.View animation="bounceIn" duration={800} style={styles.logoContainer}>
                    <Image source={LOGO_IMAGE} style={styles.logoImage} resizeMode="contain" />
                </Animatable.View>

                {/* Welcome Image */}
                <Animatable.View animation="fadeIn" delay={200} style={styles.welcomeContainer}>
                    <Image source={WELCOME_IMAGE} style={styles.welcomeImage} resizeMode="contain" />
                    <Title style={styles.usernameText}>{username}!</Title>
                </Animatable.View>

                {/* XP/Level Stats Section */}
                <Animatable.View animation="fadeInUp" delay={300} style={styles.xpSection}>
                    <View style={styles.xpCard}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelLabel}>LVL</Text>
                            <Text style={styles.levelNumber}>{userXP.level || 1}</Text>
                        </View>
                        <View style={styles.xpInfo}>
                            <View style={styles.xpHeader}>
                                <MaterialCommunityIcons name="star" size={18} color="#FFD700" />
                                <Text style={styles.xpText}>{userXP.xp || 0} XP</Text>
                            </View>
                            <View style={styles.xpProgressBar}>
                                <View style={[
                                    styles.xpProgressFill,
                                    {
                                        width: `${Math.min(100, ((userXP.xp || 0) - api.xp.getXpForLevel(userXP.level || 1)) /
                                            (api.xp.getXpForLevel((userXP.level || 1) + 1) - api.xp.getXpForLevel(userXP.level || 1)) * 100)}%`
                                    }
                                ]} />
                            </View>
                            <Text style={styles.xpToNext}>
                                {api.xp.getXpForLevel((userXP.level || 1) + 1) - (userXP.xp || 0)} XP to Level {(userXP.level || 1) + 1}
                            </Text>
                        </View>
                    </View>
                </Animatable.View>

                {/* Lesson & Quiz Cards Row */}
                <View style={styles.cardsRow}>
                    {/* Lesson Card */}
                    <FloatingCard delay={0} style={styles.cardWrapper}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Lessons')}
                            style={styles.mainCard}
                        >
                            <Image source={LESSONS_CARD_IMAGE} style={styles.cardImage} resizeMode="cover" />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Lessons</Text>
                                <Text style={styles.cardSubtitle}>Continue Learning</Text>
                            </View>
                        </TouchableOpacity>
                    </FloatingCard>

                    {/* Quiz Card */}
                    <FloatingCard delay={300} style={styles.cardWrapper}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Quiz')}
                            style={styles.mainCard}
                        >
                            <Image source={QUIZ_CARD_IMAGE} style={styles.cardImage} resizeMode="cover" />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Quiz</Text>
                                <Text style={styles.cardSubtitle}>Test Your Knowledge</Text>
                            </View>
                        </TouchableOpacity>
                    </FloatingCard>
                </View>

                {/* Analytics Card */}
                <AnalyticsCard strugglingLessons={strugglingLessons} />

                {/* Announcements Section */}
                <Animatable.View animation="fadeIn" delay={500} style={styles.announcementSection}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#fff" />
                        <Text style={styles.sectionTitle}>Announcements</Text>
                    </View>

                    <View style={styles.announcementList}>
                        {announcements.length > 0 ? (
                            announcements.map((announcement, index) => (
                                <AnnouncementItem
                                    key={announcement.id}
                                    announcement={announcement}
                                    index={index}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyAnnouncement}>
                                <Text style={styles.emptyAnnouncementText}>No announcements yet</Text>
                            </View>
                        )}
                    </View>
                </Animatable.View>

                <View style={{ height: 100 }} />
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
    scrollContent: {
        paddingBottom: 20,
    },
    // Logo
    logoContainer: {
        alignItems: 'center',
        marginTop: 30,
        paddingHorizontal: 16,
    },
    logoImage: {
        width: '100%',
        height: 160,
    },
    // Welcome
    welcomeContainer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    welcomeImage: {
        width: 250,
        height: 60,
        marginBottom: 4,
    },
    usernameText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    // Notification Button
    notificationButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 100,
    },
    notificationIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    // XP Section
    xpSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    xpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        gap: 16,
    },
    levelBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#2D3436',
    },
    levelLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: 'bold',
    },
    levelNumber: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: -2,
    },
    xpInfo: {
        flex: 1,
    },
    xpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    xpText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    xpProgressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    xpProgressFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    xpToNext: {
        fontSize: 11,
        color: '#636E72',
    },
    // Cards Row
    cardsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    cardWrapper: {
        flex: 1,
    },
    mainCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    cardImage: {
        width: '100%',
        height: 100,
    },
    cardContent: {
        padding: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    progressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    progressLabel: {
        fontSize: 13,
        color: '#636E72',
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginTop: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2D3436',
        borderRadius: 4,
    },
    // Analytics Card
    analyticsCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    analyticsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    analyticsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D14343',
    },
    struggleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F0',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    struggleIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFE0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    struggleInfo: {
        flex: 1,
        marginLeft: 12,
    },
    struggleName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    struggleScore: {
        fontSize: 12,
        color: '#FF6B6B',
        marginTop: 2,
    },
    reviewButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    reviewButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    noStruggleContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    noStruggleEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    noStruggleText: {
        fontSize: 14,
        color: '#00B894',
        fontWeight: '600',
    },
    // Announcements Section
    announcementSection: {
        marginHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    announcementList: {
        gap: 16,
    },
    announcementWrapper: {
        position: 'relative',
        marginLeft: 10,
    },
    speechPointer: {
        position: 'absolute',
        left: -10,
        top: 18,
        width: 0,
        height: 0,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderRightWidth: 12,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: '#2D3436',
        zIndex: 1,
    },
    announcementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#2D3436',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    announcementIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2D3436',
    },
    announcementContent: {
        flex: 1,
        marginLeft: 12,
    },
    announcementTitle: {
        fontSize: 14,
        color: '#2D3436',
        lineHeight: 20,
    },
    teacherName: {
        fontWeight: 'bold',
    },
    announcementMessage: {
        fontSize: 13,
        color: '#636E72',
        fontWeight: '600',
        marginTop: 2,
    },
    announcementDate: {
        fontSize: 12,
        color: '#B2BEC3',
        marginTop: 4,
    },
    emptyAnnouncement: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#2D3436',
    },
    emptyAnnouncementText: {
        fontSize: 14,
        color: '#B2BEC3',
    },
});
