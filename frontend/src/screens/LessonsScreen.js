import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions, ImageBackground } from 'react-native';
import { Text, Title, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

// Map categories to local assets and icons
const THEME_CONFIG = {
  'ICT': {
    image: require('../../assets/images/lesson_ict.jpg'),
    icon: 'laptop',
    color: '#6C63FF'
  },
  'Agriculture': {
    image: require('../../assets/images/lesson_agriculture.jpg'),
    icon: 'flower',
    color: '#00B894'
  },
  'Tourism': {
    image: require('../../assets/images/lesson_tourism.jpg'),
    icon: 'airplane',
    color: '#FF6B6B'
  },
  'Industrial Arts': {
    image: require('../../assets/images/lesson_industrial.jpg'),
    icon: 'hammer-wrench',
    color: '#FF9F43'
  },
  'Default': {
    image: require('../../assets/images/lesson_ict.jpg'),
    icon: 'book-open-page-variant',
    color: '#2D3436'
  }
};

// Background image
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

export default function LessonsScreen({ navigation }) {
  const { user } = useAuthStore();
  const theme = useTheme();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topicCounts, setTopicCounts] = useState({});

  const fetchLessons = async () => {
    try {
      const [lessonsData, quizProgress] = await Promise.all([
        api.lessons.getAll(),
        api.progress.getUserQuizProgress(user.id)
      ]);

      // Fetch topic counts for each lesson
      const counts = {};
      for (const lesson of lessonsData) {
        try {
          const topics = await api.lessons.getTopics(lesson.id);
          counts[lesson.id] = topics?.length || 0;
        } catch {
          counts[lesson.id] = 0;
        }
      }
      setTopicCounts(counts);

      const lessonsWithQuizzes = await Promise.all(lessonsData.map(async (lesson) => {
        const quiz = await api.quizzes.getByLessonId(lesson.id);
        return { ...lesson, quizId: quiz?.id };
      }));

      const passedQuizIds = quizProgress.filter(p => p.score >= 70).map(p => p.quiz_id);

      const lessonsWithStatus = lessonsWithQuizzes.map((l, index) => {
        let isUnlocked = index === 0;
        if (index > 0) {
          const prevLesson = lessonsWithQuizzes[index - 1];
          if (prevLesson.quizId && passedQuizIds.includes(prevLesson.quizId)) {
            isUnlocked = true;
          }
        }

        // Calculate progress for this lesson (based on quiz score if completed)
        const quizResult = quizProgress.find(p => p.quiz_id === l.quizId);
        const progress = quizResult ? quizResult.score : 0;

        return {
          ...l,
          locked: !isUnlocked,
          completed: l.quizId && passedQuizIds.includes(l.quizId),
          progress,
        };
      });
      setLessons(lessonsWithStatus);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchLessons();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLessons();
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const completedCount = lessons.filter(l => l.completed).length;
  const overallProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

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
          {/* LearnHub Logo Button */}
          <View style={styles.learnHubBadge}>
            <View style={styles.bookIconContainer}>
              <View style={[styles.bookPage, { backgroundColor: '#FF6B6B' }]} />
              <View style={[styles.bookPage, { backgroundColor: '#00B894', marginLeft: 2 }]} />
              <View style={[styles.bookPage, { backgroundColor: '#6C63FF', marginLeft: 2 }]} />
            </View>
            <Text style={styles.learnHubText}>LearnHub</Text>
          </View>
          <Text style={styles.headerSubtitle}>Master each lesson to unlock the next</Text>

          {/* Progress Summary */}
          <View style={styles.progressSummary}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
              </View>
            </View>
            <Text style={styles.progressPercent}>{overallProgress}%</Text>
          </View>
        </Animatable.View>

        {/* Lesson Cards Grid */}
        <View style={styles.cardsGrid}>
          {lessons.map((lesson, index) => {
            const config = THEME_CONFIG[lesson.category] || THEME_CONFIG['Default'];
            const topicCount = topicCounts[lesson.id] || 0;

            return (
              <Animatable.View
                key={lesson.id}
                animation="fadeInUp"
                delay={index * 100}
                style={styles.cardWrapper}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!lesson.locked) {
                      navigation.navigate('LessonDetail', { lessonId: lesson.id, title: lesson.title });
                    }
                  }}
                  disabled={lesson.locked}
                  style={[
                    styles.lessonCard,
                    lesson.locked && styles.lockedCard,
                  ]}
                >
                  {/* Image Section */}
                  <View style={styles.cardImageContainer}>
                    <Image source={config.image} style={styles.cardImage} resizeMode="cover" />
                    {lesson.locked && (
                      <View style={styles.lockOverlay}>
                        <MaterialCommunityIcons name="lock" size={32} color="#fff" />
                      </View>
                    )}
                    {lesson.completed && (
                      <View style={styles.completedBadge}>
                        <MaterialCommunityIcons name="check-circle" size={24} color="#00B894" />
                      </View>
                    )}
                  </View>

                  {/* Content Section */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleSection}>
                        <Text style={[styles.cardTitle, lesson.locked && styles.lockedText]}>
                          {lesson.title}
                        </Text>
                        <Text style={[styles.cardSubtitle, lesson.locked && styles.lockedText]}>
                          {topicCount} {topicCount === 1 ? 'lesson' : 'lessons'}
                        </Text>
                      </View>
                      <View style={[styles.iconCircle, { borderColor: lesson.locked ? '#E0E0E0' : '#2D3436' }]}>
                        <MaterialCommunityIcons
                          name={config.icon}
                          size={20}
                          color={lesson.locked ? '#B2BEC3' : '#2D3436'}
                        />
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.cardProgressSection}>
                      <Text style={[styles.cardProgressLabel, lesson.locked && styles.lockedText]}>
                        Progress
                      </Text>
                      <Text style={[styles.cardProgressPercent, lesson.locked && styles.lockedText]}>
                        {lesson.progress}%
                      </Text>
                    </View>
                    <View style={styles.cardProgressBarBg}>
                      <View
                        style={[
                          styles.cardProgressBarFill,
                          { width: `${lesson.progress}%` },
                          lesson.locked && styles.lockedProgressBar
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            );
          })}
        </View>
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
  },
  learnHubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  // Progress Summary
  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#2D3436',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressInfo: {
    flex: 1,
    marginRight: 16,
  },
  progressLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2D3436',
    borderRadius: 5,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  // Cards Grid
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  cardWrapper: {
    width: (width - 36) / 2,
  },
  // Lesson Card
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#2D3436',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedCard: {
    opacity: 0.8,
    borderColor: '#E0E0E0',
  },
  // Card Image
  cardImageContainer: {
    height: 100,
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  // Card Content
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  lockedText: {
    color: '#B2BEC3',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Card Progress
  cardProgressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  cardProgressLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  cardProgressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  cardProgressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    backgroundColor: '#2D3436',
    borderRadius: 4,
  },
  lockedProgressBar: {
    backgroundColor: '#B2BEC3',
  },
});
