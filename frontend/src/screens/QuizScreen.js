import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { Title, Button, Text, ActivityIndicator, useTheme, ProgressBar, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Speech from 'expo-speech';
import ConfettiCannon from 'react-native-confetti-cannon';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { AnimatedCounter } from '../components/gamification';

const { width } = Dimensions.get('window');

// Background image
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

export default function QuizScreen({ route, navigation }) {
    const { lessonId, quizId: passedQuizId, topicId, questions: passedQuestions, quizTitle, topicOrder = 1 } = route.params || {};
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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [xpResult, setXpResult] = useState(null);
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

        return () => {
            Speech.stop();
        };
    }, [lessonId, passedQuizId, passedQuestions]);

    // Auto-read question when it changes
    useEffect(() => {
        if (questions.length > 0 && !loading && !showResult) {
            const currentQuestion = questions[currentQuestionIndex];
            if (currentQuestion) {
                // Build the text to read
                const optionLetters = ['A', 'B', 'C', 'D'];
                const optionsText = currentQuestion.options
                    .map((opt, i) => `${optionLetters[i]}: ${opt}`)
                    .join('. ');
                const textToRead = `Question ${currentQuestionIndex + 1}. ${currentQuestion.question_text}. Options: ${optionsText}`;

                // Small delay to let animation complete
                const timer = setTimeout(() => {
                    setIsSpeaking(true);
                    Speech.speak(textToRead, {
                        language: 'en',
                        rate: 0.85,
                        onDone: () => setIsSpeaking(false),
                        onStopped: () => setIsSpeaking(false),
                        onError: () => setIsSpeaking(false)
                    });
                }, 300);

                return () => {
                    clearTimeout(timer);
                    Speech.stop();
                };
            }
        }
    }, [currentQuestionIndex, questions, loading, showResult]);

    const handleAnswer = (value) => {
        if (selectedOption !== null) return; // Prevent changing answer

        Speech.stop(); // Stop reading question
        setSelectedOption(value);
        setAnswers({ ...answers, [questions[currentQuestionIndex].id]: value });

        // Provide audio feedback
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = value === currentQuestion.correct_answer;

        // Speak feedback
        Speech.speak(isCorrect ? 'Correct!' : 'Incorrect', {
            language: 'en',
            rate: 1.0,
            onDone: () => {
                // Auto-proceed to next question after speech
                setTimeout(() => {
                    if (currentQuestionIndex < questions.length - 1) {
                        setSelectedOption(null);
                        setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                        submitQuiz();
                    }
                }, 500);
            }
        });
    };

    const handleNext = () => {
        // This is now only used as a fallback
        Speech.stop();
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

            // Award XP if passed
            if (passed && user) {
                try {
                    const result = await api.xp.awardQuizXP(user.id, topicOrder, passed, percentage);
                    setXpResult(result);
                    console.log('Quiz XP awarded:', result);
                } catch (xpError) {
                    console.error('Error awarding quiz XP:', xpError);
                }
            }

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
            <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            </ImageBackground>
        );
    }

    if (!lessonId && !passedQuizId) {
        return (
            <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
                <View style={styles.emptyState}>
                    <Animatable.View animation="bounceIn">
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="brain" size={60} color="#6C63FF" />
                        </View>
                    </Animatable.View>
                    <Title style={styles.emptyTitle}>Ready to Test Your Knowledge?</Title>
                    <Text style={styles.emptyText}>Select a lesson or topic to take a quiz.</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Lessons')}
                        style={styles.goToLessonsButton}
                    >
                        <Text style={styles.goToLessonsText}>Go to Lessons</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        );
    }

    if (!quiz) {
        return (
            <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconCircle}>
                        <MaterialCommunityIcons name="alert-circle" size={60} color="#636E72" />
                    </View>
                    <Text style={styles.emptyText}>No quiz available for this lesson.</Text>
                </View>
            </ImageBackground>
        );
    }

    // Show Result Screen
    if (showResult) {
        const passed = finalScore >= (quiz.passing_score || 70);
        const xpEarned = Math.round(finalScore * 2);

        return (
            <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
                <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} autoStart={false} ref={confettiRef} fadeOut={true} />

                <View style={styles.resultContainer}>
                    <Animatable.View animation="bounceIn" delay={200}>
                        <View style={[styles.resultCard, passed ? styles.passedCard : styles.failedCard]}>
                            <Text style={styles.resultEmoji}>{passed ? '🎉' : '💪'}</Text>

                            <Title style={styles.resultTitle}>
                                {passed ? 'Congratulations!' : 'Keep Trying!'}
                            </Title>
                            <Text style={styles.resultSubtitle}>
                                {passed ? 'You passed the quiz!' : `You need ${quiz.passing_score || 70}% to pass.`}
                            </Text>

                            <View style={styles.scoreSection}>
                                <Text style={styles.scoreLabel}>Your Score</Text>
                                <AnimatedCounter
                                    value={finalScore}
                                    suffix="%"
                                    duration={1500}
                                    textStyle={[styles.scoreValue, { color: passed ? '#00B894' : '#E17055' }]}
                                />
                            </View>

                            <View style={styles.xpEarnedContainer}>
                                <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                                <Text style={styles.xpEarnedText}>
                                    +{xpResult ? xpResult.xpAwarded : 0} XP Earned!
                                </Text>
                                {xpResult && xpResult.leveledUp && (
                                    <Text style={styles.levelUpText}> 🎉 Level Up!</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleFinish}
                                style={styles.finishButton}
                            >
                                <Text style={styles.finishButtonText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </Animatable.View>
                </View>
            </ImageBackground>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = (currentQuestionIndex + 1) / questions.length;

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animatable.View animation="fadeInDown" duration={600} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonCircle}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color="#2D3436" />
                    </TouchableOpacity>

                    {/* Quiz Title Badge */}
                    <View style={styles.titleBadge}>
                        <MaterialCommunityIcons name="brain" size={18} color="#6C63FF" style={{ marginRight: 8 }} />
                        <Text style={styles.titleBadgeText}>{quiz.title || 'Quiz'}</Text>
                    </View>

                    {/* Progress Section */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
                            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
                    </View>
                </Animatable.View>

                {/* Question Card */}
                <Animatable.View animation="fadeIn" key={currentQuestionIndex} style={styles.questionContainer}>
                    <View style={styles.questionCard}>
                        <View style={styles.questionNumberBadge}>
                            <Text style={styles.questionNumberText}>Q{currentQuestionIndex + 1}</Text>
                        </View>
                        <Text style={styles.questionText}>{currentQuestion.question_text}</Text>
                    </View>
                </Animatable.View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedOption === option;
                        const hasAnswered = selectedOption !== null;
                        const optionColors = ['#FF6B6B', '#6C63FF', '#00B894', '#FF9F43'];
                        const optionColor = optionColors[index % optionColors.length];

                        // Show correct/incorrect after answering
                        const isCorrectAnswer = option === currentQuestion.correct_answer;
                        const showCorrect = hasAnswered && isCorrectAnswer;
                        const showIncorrect = hasAnswered && isSelected && !isCorrectAnswer;

                        return (
                            <Animatable.View key={index} animation="fadeInUp" delay={index * 100}>
                                <TouchableOpacity
                                    onPress={() => handleAnswer(option)}
                                    activeOpacity={0.7}
                                    disabled={hasAnswered}
                                >
                                    <View style={[
                                        styles.optionCard,
                                        isSelected && [styles.selectedOptionCard, { borderColor: optionColor }],
                                        showCorrect && styles.correctOptionCard,
                                        showIncorrect && styles.incorrectOptionCard,
                                        hasAnswered && !isSelected && !showCorrect && styles.disabledOptionCard
                                    ]}>
                                        <View style={[
                                            styles.optionCircle,
                                            { backgroundColor: isSelected ? optionColor : (showCorrect ? '#00B894' : '#F5F5F5') }
                                        ]}>
                                            <Text style={[styles.optionLetter, (isSelected || showCorrect) && { color: '#fff' }]}>
                                                {String.fromCharCode(65 + index)}
                                            </Text>
                                        </View>
                                        <Text style={[styles.optionText, isSelected && { fontWeight: 'bold' }]}>
                                            {option}
                                        </Text>
                                        {showCorrect && (
                                            <MaterialCommunityIcons name="check-circle" size={22} color="#00B894" />
                                        )}
                                        {showIncorrect && (
                                            <MaterialCommunityIcons name="close-circle" size={22} color="#E17055" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </Animatable.View>
                        );
                    })}
                </View>

                {/* Next Button */}
                <Animatable.View animation="fadeInUp" delay={500} style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={handleNext}
                        disabled={!selectedOption || submitting}
                        style={[styles.nextButton, (!selectedOption || submitting) && styles.disabledButton]}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>
                                    {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                                </Text>
                                <MaterialCommunityIcons
                                    name={currentQuestionIndex === questions.length - 1 ? "check-circle" : "arrow-right"}
                                    size={20}
                                    color="#fff"
                                />
                            </>
                        )}
                    </TouchableOpacity>
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
    },
    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#2D3436',
        marginBottom: 20,
    },
    emptyTitle: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 8,
        marginBottom: 24,
    },
    goToLessonsButton: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#2D3436',
    },
    goToLessonsText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Header
    header: {
        padding: 16,
        paddingTop: 60,
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
        marginBottom: 16,
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
        marginBottom: 16,
        maxWidth: '90%',
    },
    titleBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3436',
        flexShrink: 1,
    },
    progressCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        padding: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressText: {
        color: '#636E72',
        fontWeight: '600',
    },
    progressPercent: {
        color: '#6C63FF',
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#6C63FF',
        borderRadius: 5,
    },
    // Question Card
    questionContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    questionNumberBadge: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    questionNumberText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    questionText: {
        fontSize: 18,
        lineHeight: 26,
        color: '#2D3436',
        fontWeight: '600',
    },
    // Options
    optionsContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        padding: 16,
        marginBottom: 12,
    },
    selectedOptionCard: {
        borderWidth: 3,
        backgroundColor: '#F8F9FA',
    },
    correctOptionCard: {
        borderWidth: 3,
        borderColor: '#00B894',
        backgroundColor: '#E8F8F5',
    },
    incorrectOptionCard: {
        borderWidth: 3,
        borderColor: '#E17055',
        backgroundColor: '#FDEDEC',
    },
    disabledOptionCard: {
        opacity: 0.5,
    },
    optionCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionLetter: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#636E72',
    },
    optionText: {
        fontSize: 15,
        flex: 1,
        color: '#2D3436',
    },
    // Next Button
    buttonContainer: {
        paddingHorizontal: 16,
    },
    nextButton: {
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
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#B2BEC3',
    },
    // Result Screen
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 30,
        alignItems: 'center',
        width: width - 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    passedCard: {
        borderTopWidth: 6,
        borderTopColor: '#00B894',
    },
    failedCard: {
        borderTopWidth: 6,
        borderTopColor: '#E17055',
    },
    resultEmoji: {
        fontSize: 60,
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2D3436',
        textAlign: 'center',
    },
    resultSubtitle: {
        fontSize: 14,
        color: '#636E72',
        textAlign: 'center',
        marginTop: 8,
    },
    scoreSection: {
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        width: '100%',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 56,
        fontWeight: 'bold',
    },
    xpEarnedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    xpEarnedText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFB800',
    },
    levelUpText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00B894',
    },
    finishButton: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#2D3436',
        marginTop: 24,
    },
    finishButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
