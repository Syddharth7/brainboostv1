import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { Title, Button, Text, ActivityIndicator, useTheme, ProgressBar, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import ConfettiCannon from 'react-native-confetti-cannon';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { AnimatedCounter } from '../components/gamification';

const { width } = Dimensions.get('window');

export default function QuizScreen({ route, navigation }) {
    const { lessonId, quizId: passedQuizId, topicId, questions: passedQuestions, quizTitle } = route.params || {};
    const { user } = useAuthStore();
    const theme = useTheme();
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const confettiRef = useRef(null);

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                if (passedQuizId && passedQuestions) {
                    setQuiz({ id: passedQuizId, title: quizTitle, passing_score: 70 });
                    const shuffledQuestions = [...passedQuestions].sort(() => Math.random() - 0.5);
                    setQuestions(shuffledQuestions);
                    setLoading(false);
                    return;
                }

                if (lessonId) {
                    const data = await api.quizzes.getByLessonId(lessonId);
                    setQuiz(data);
                    if (data && data.quiz_questions) {
                        const shuffledQuestions = [...data.quiz_questions].sort(() => Math.random() - 0.5);
                        setQuestions(shuffledQuestions);
                    }
                }
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Could not load quiz');
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [lessonId, passedQuizId, passedQuestions]);

    const handleAnswer = (value) => {
        setSelectedOption(value);
        setAnswers({ ...answers, [questions[currentQuestionIndex].id]: value });
    };

    const handleNext = () => {
        setSelectedOption(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        setSubmitting(true);
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) score++;
        });

        const percentage = Math.round((score / questions.length) * 100);
        setFinalScore(percentage);
        const passed = percentage >= (quiz.passing_score || 70);

        try {
            await api.quizzes.submitAttempt(user.id, quiz.id, percentage, answers);
            setShowResult(true);

            if (passed && confettiRef.current) {
                setTimeout(() => confettiRef.current.start(), 500);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinish = () => {
        navigation.goBack();
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!lessonId && !passedQuizId) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Animatable.View animation="bounceIn">
                        <MaterialCommunityIcons name="brain" size={80} color={theme.colors.primary} />
                    </Animatable.View>
                    <Title style={styles.emptyTitle}>Ready to Test Your Knowledge?</Title>
                    <Text style={styles.emptyText}>Select a lesson or topic to take a quiz.</Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('Lessons')}
                        style={styles.goToLessonsButton}
                    >
                        Go to Lessons
                    </Button>
                </View>
            </View>
        );
    }

    if (!quiz) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="alert-circle" size={80} color="#636E72" />
                    <Text style={styles.emptyText}>No quiz available for this lesson.</Text>
                </View>
            </View>
        );
    }

    // Show Result Screen
    if (showResult) {
        const passed = finalScore >= (quiz.passing_score || 70);
        const xpEarned = Math.round(finalScore * 2);

        return (
            <View style={styles.container}>
                <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} autoStart={false} ref={confettiRef} fadeOut={true} />

                <View style={styles.resultContainer}>
                    <Animatable.View animation="bounceIn" delay={200}>
                        <View style={[styles.resultIconContainer, { backgroundColor: passed ? '#E8F8F5' : '#FDEDEC' }]}>
                            <Text style={styles.resultEmoji}>{passed ? '🎉' : '💪'}</Text>
                        </View>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" delay={400}>
                        <Title style={styles.resultTitle}>
                            {passed ? 'Congratulations!' : 'Keep Trying!'}
                        </Title>
                        <Text style={styles.resultSubtitle}>
                            {passed ? 'You passed the quiz!' : `You need ${quiz.passing_score || 70}% to pass.`}
                        </Text>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" delay={600} style={styles.scoreCard}>
                        <Card style={styles.scoreCardInner}>
                            <Card.Content style={styles.scoreCardContent}>
                                <Text style={styles.scoreLabel}>Your Score</Text>
                                <AnimatedCounter
                                    value={finalScore}
                                    suffix="%"
                                    duration={1500}
                                    textStyle={[styles.scoreValue, { color: passed ? '#00B894' : '#E17055' }]}
                                />
                            </Card.Content>
                        </Card>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" delay={800} style={styles.xpEarnedContainer}>
                        <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                        <Text style={styles.xpEarnedText}>+{xpEarned} XP Earned!</Text>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" delay={1000} style={styles.resultButtons}>
                        <Button
                            mode="contained"
                            onPress={handleFinish}
                            style={styles.finishButton}
                        >
                            Continue
                        </Button>
                    </Animatable.View>
                </View>
            </View>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = (currentQuestionIndex + 1) / questions.length;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                    <Title style={styles.quizTitle}>{quiz.title}</Title>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressInfo}>
                            <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
                        </View>
                        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
                    </View>
                </Animatable.View>

                {/* Question Card */}
                <Animatable.View animation="fadeIn" key={currentQuestionIndex}>
                    <Card style={styles.questionCard}>
                        <Card.Content>
                            <Title style={styles.questionText}>{currentQuestion.question_text}</Title>
                        </Card.Content>
                    </Card>
                </Animatable.View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedOption === option;
                        return (
                            <Animatable.View key={index} animation="fadeInUp" delay={index * 100}>
                                <TouchableOpacity
                                    onPress={() => handleAnswer(option)}
                                    activeOpacity={0.7}
                                >
                                    <Card style={[
                                        styles.optionCard,
                                        isSelected && styles.selectedOptionCard
                                    ]}>
                                        <Card.Content style={styles.optionContent}>
                                            <View style={[
                                                styles.optionCircle,
                                                isSelected && { backgroundColor: theme.colors.primary }
                                            ]}>
                                                <Text style={[
                                                    styles.optionLetter,
                                                    isSelected && { color: '#fff' }
                                                ]}>
                                                    {String.fromCharCode(65 + index)}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                styles.optionText,
                                                isSelected && { fontWeight: 'bold', color: theme.colors.primary }
                                            ]}>
                                                {option}
                                            </Text>
                                            {isSelected && (
                                                <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
                                            )}
                                        </Card.Content>
                                    </Card>
                                </TouchableOpacity>
                            </Animatable.View>
                        );
                    })}
                </View>

                {/* Next Button */}
                <Animatable.View animation="fadeInUp" delay={500}>
                    <Button
                        mode="contained"
                        onPress={handleNext}
                        disabled={!selectedOption || submitting}
                        loading={submitting}
                        style={styles.nextButton}
                        contentStyle={styles.nextButtonContent}
                    >
                        {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                    </Button>
                </Animatable.View>
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
        padding: 20,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        marginTop: 20,
        textAlign: 'center',
        color: '#2D3436',
    },
    emptyText: {
        textAlign: 'center',
        color: '#636E72',
        marginTop: 8,
        marginBottom: 24,
    },
    goToLessonsButton: {
        borderRadius: 12,
    },
    header: {
        paddingTop: 40,
        marginBottom: 20,
    },
    quizTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2D3436',
    },
    progressContainer: {},
    progressInfo: {
        marginBottom: 8,
    },
    progressText: {
        color: '#636E72',
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    questionCard: {
        marginBottom: 24,
        borderRadius: 16,
        elevation: 3,
        backgroundColor: '#fff',
    },
    questionText: {
        fontSize: 18,
        lineHeight: 26,
        color: '#2D3436',
        padding: 8,
    },
    optionsContainer: {
        marginBottom: 20,
    },
    optionCard: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: '#fff',
    },
    selectedOptionCard: {
        borderWidth: 2,
        borderColor: '#6C63FF',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionLetter: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#636E72',
    },
    optionText: {
        fontSize: 15,
        flex: 1,
        color: '#2D3436',
    },
    nextButton: {
        borderRadius: 12,
    },
    nextButtonContent: {
        paddingVertical: 8,
    },
    // Result Screen Styles
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    resultIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    resultEmoji: {
        fontSize: 60,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3436',
        textAlign: 'center',
    },
    resultSubtitle: {
        fontSize: 16,
        color: '#636E72',
        textAlign: 'center',
        marginTop: 8,
    },
    scoreCard: {
        width: '100%',
        marginTop: 30,
    },
    scoreCardInner: {
        borderRadius: 20,
        elevation: 4,
        backgroundColor: '#fff',
    },
    scoreCardContent: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 64,
        fontWeight: 'bold',
    },
    xpEarnedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
    },
    xpEarnedText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFB800',
    },
    resultButtons: {
        width: '100%',
        marginTop: 40,
    },
    finishButton: {
        borderRadius: 12,
        paddingVertical: 4,
    },
});
