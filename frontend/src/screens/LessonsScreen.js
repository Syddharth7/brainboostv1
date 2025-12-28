import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, Title, ActivityIndicator, useTheme, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

// Map categories to local assets
const THEME_IMAGES = {
  'ICT': require('../../assets/images/lesson_ict.png'),
  'Agriculture': require('../../assets/images/lesson_agriculture.png'),
  'Tourism': require('../../assets/images/lesson_tourism.png'),
  'Industrial Arts': require('../../assets/images/lesson_ict.png'),
  'Default': require('../../assets/images/lesson_ict.png')
};

export default function LessonsScreen({ navigation }) {
  const { user } = useAuthStore();
  const theme = useTheme();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLessons = async () => {
    try {
      const [lessonsData, quizProgress] = await Promise.all([
        api.lessons.getAll(),
        api.progress.getUserQuizProgress(user.id)
      ]);

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

        return {
          ...l,
          locked: !isUnlocked,
          completed: l.quizId && passedQuizIds.includes(l.quizId),
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
  const progress = lessons.length > 0 ? completedCount / lessons.length : 0;

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
          <Title style={styles.headerTitle}>Learning Path</Title>
          <Text style={styles.headerSubtitle}>Master each lesson to unlock the next</Text>

          {/* Progress Summary */}
          <View style={styles.progressSummary}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={[styles.progressValue, { color: theme.colors.primary }]}>
                {completedCount}/{lessons.length} Lessons
              </Text>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Learning Path */}
        <View style={styles.pathContainer}>
          {lessons.map((lesson, index) => {
            const imageSource = THEME_IMAGES[lesson.category] || THEME_IMAGES['Default'];
            const isLast = index === lessons.length - 1;

            return (
              <Animatable.View
                key={lesson.id}
                animation="fadeInUp"
                delay={index * 100}
              >
                <View style={styles.pathItem}>
                  {/* Path Line & Node */}
                  <View style={styles.pathNodeContainer}>
                    <View style={[
                      styles.pathNode,
                      lesson.completed && styles.completedNode,
                      lesson.locked && styles.lockedNode,
                      !lesson.completed && !lesson.locked && styles.activeNode
                    ]}>
                      {lesson.completed ? (
                        <MaterialCommunityIcons name="check" size={18} color="#fff" />
                      ) : lesson.locked ? (
                        <MaterialCommunityIcons name="lock" size={14} color="#B2BEC3" />
                      ) : (
                        <Text style={styles.nodeNumber}>{index + 1}</Text>
                      )}
                    </View>
                    {!isLast && (
                      <View style={[
                        styles.pathLine,
                        lesson.completed && styles.completedLine
                      ]} />
                    )}
                  </View>

                  {/* Lesson Card */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!lesson.locked) {
                        navigation.navigate('LessonDetail', { lessonId: lesson.id, title: lesson.title });
                      }
                    }}
                    disabled={lesson.locked}
                    style={styles.lessonCardContainer}
                  >
                    <Card style={[
                      styles.lessonCard,
                      lesson.locked && styles.lockedCard,
                      lesson.completed && styles.completedCard,
                      !lesson.locked && !lesson.completed && styles.activeCard
                    ]}>
                      <Card.Content style={styles.cardContent}>
                        <Image source={imageSource} style={styles.lessonImage} resizeMode="contain" />
                        <View style={styles.lessonInfo}>
                          <Title style={[
                            styles.lessonTitle,
                            lesson.locked && styles.lockedText
                          ]}>
                            {lesson.title}
                          </Title>
                          <View style={styles.lessonMeta}>
                            <View style={[
                              styles.categoryBadge,
                              { backgroundColor: lesson.locked ? '#E0E0E0' : theme.colors.primary + '15' }
                            ]}>
                              <Text style={[
                                styles.categoryText,
                                { color: lesson.locked ? '#B2BEC3' : theme.colors.primary }
                              ]}>
                                {lesson.category}
                              </Text>
                            </View>
                            {lesson.completed && (
                              <View style={styles.xpBadge}>
                                <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                                <Text style={styles.xpText}>+100 XP</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <MaterialCommunityIcons
                          name={lesson.locked ? "lock" : "chevron-right"}
                          size={24}
                          color={lesson.locked ? '#B2BEC3' : theme.colors.primary}
                        />
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 20,
  },
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressInfo: {},
  progressLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pathContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  pathItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pathNodeContainer: {
    width: 40,
    alignItems: 'center',
  },
  pathNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 14,
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
  lessonCardContainer: {
    flex: 1,
    marginLeft: 12,
  },
  lessonCard: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  lockedCard: {
    opacity: 0.7,
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00B894',
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  lessonImage: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 6,
  },
  lockedText: {
    color: '#B2BEC3',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    gap: 4,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFB800',
  },
});
