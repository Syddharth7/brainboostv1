import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, RefreshControl, ImageBackground } from 'react-native';
import { Text, TextInput, ActivityIndicator, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';

const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

export default function QuizEditorScreen({ navigation, route }) {
    const { topic, lesson } = route.params;
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Quiz modal state
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [quizForm, setQuizForm] = useState({
        title: '',
        passingScore: 70
    });

    // Question modal state
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [questionForm, setQuestionForm] = useState({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        order: 1
    });
    const [saving, setSaving] = useState(false);

    // Fetch quiz and questions
    const fetchData = useCallback(async () => {
        try {
            const quizzes = await api.quizzesAdmin.getByTopicId(topic.id);
            if (quizzes && quizzes.length > 0) {
                setQuiz(quizzes[0]);
                setQuestions(quizzes[0].quiz_questions || []);
            } else {
                setQuiz(null);
                setQuestions([]);
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            Alert.alert('Error', 'Failed to load quiz');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [topic.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Create quiz
    const handleCreateQuiz = () => {
        setQuizForm({ title: `${topic.title} Quiz`, passingScore: 70 });
        setShowQuizModal(true);
    };

    const handleSaveQuiz = async () => {
        if (!quizForm.title.trim()) {
            Alert.alert('Error', 'Title is required');
            return;
        }

        setSaving(true);
        try {
            if (quiz) {
                await api.quizzesAdmin.update(quiz.id, {
                    title: quizForm.title,
                    passing_score: quizForm.passingScore
                });
            } else {
                await api.quizzesAdmin.create(topic.id, quizForm.title, quizForm.passingScore);
            }
            setShowQuizModal(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    // Delete quiz
    const handleDeleteQuiz = () => {
        Alert.alert(
            'Delete Quiz',
            'Are you sure? This will delete all questions too.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.quizzesAdmin.delete(quiz.id);
                            setQuiz(null);
                            setQuestions([]);
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    // Add question
    const handleAddQuestion = () => {
        setEditingQuestion(null);
        setQuestionForm({
            questionText: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 'A',
            order: questions.length + 1
        });
        setShowQuestionModal(true);
    };

    // Edit question
    const handleEditQuestion = (question) => {
        setEditingQuestion(question);
        const options = question.options || [];
        setQuestionForm({
            questionText: question.question_text,
            optionA: options[0] || '',
            optionB: options[1] || '',
            optionC: options[2] || '',
            optionD: options[3] || '',
            correctAnswer: question.correct_answer,
            order: question.order
        });
        setShowQuestionModal(true);
    };

    // Save question
    const handleSaveQuestion = async () => {
        if (!questionForm.questionText.trim()) {
            Alert.alert('Error', 'Question text is required');
            return;
        }
        if (!questionForm.optionA.trim() || !questionForm.optionB.trim()) {
            Alert.alert('Error', 'At least 2 options are required');
            return;
        }

        setSaving(true);
        try {
            const options = [
                questionForm.optionA,
                questionForm.optionB,
                questionForm.optionC,
                questionForm.optionD
            ].filter(o => o.trim());

            if (editingQuestion) {
                await api.quizQuestions.update(editingQuestion.id, {
                    question_text: questionForm.questionText,
                    options,
                    correct_answer: questionForm.correctAnswer,
                    order: questionForm.order
                });
            } else {
                await api.quizQuestions.create(
                    quiz.id,
                    questionForm.questionText,
                    options,
                    questionForm.correctAnswer,
                    questionForm.order
                );
            }
            setShowQuestionModal(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    // Delete question
    const handleDeleteQuestion = (question) => {
        Alert.alert(
            'Delete Question',
            'Are you sure you want to delete this question?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.quizQuestions.delete(question.id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <ImageBackground source={DASHBOARD_BG} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />
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
                        <Title style={styles.headerTitle} numberOfLines={1}>Quiz: {topic.title}</Title>
                        <Text style={styles.headerSubtitle}>{lesson.category}</Text>
                    </View>
                </Animatable.View>

                {/* Quiz Info or Create */}
                {!quiz ? (
                    <TouchableOpacity style={styles.createQuizButton} onPress={handleCreateQuiz}>
                        <MaterialCommunityIcons name="plus-circle" size={32} color="#fff" />
                        <Text style={styles.createQuizText}>Create Quiz for this Topic</Text>
                    </TouchableOpacity>
                ) : (
                    <Animatable.View animation="fadeIn" style={styles.quizInfo}>
                        <View style={styles.quizHeader}>
                            <View>
                                <Text style={styles.quizTitle}>{quiz.title}</Text>
                                <Text style={styles.quizMeta}>Passing Score: {quiz.passing_score}%</Text>
                            </View>
                            <View style={styles.quizActions}>
                                <TouchableOpacity
                                    style={styles.smallButton}
                                    onPress={() => {
                                        setQuizForm({ title: quiz.title, passingScore: quiz.passing_score });
                                        setShowQuizModal(true);
                                    }}
                                >
                                    <MaterialCommunityIcons name="pencil" size={18} color="#6C63FF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.smallButton}
                                    onPress={handleDeleteQuiz}
                                >
                                    <MaterialCommunityIcons name="delete" size={18} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animatable.View>
                )}

                {/* Questions Section */}
                {quiz && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                <MaterialCommunityIcons name="help-circle" size={18} color="#fff" /> Questions ({questions.length})
                            </Text>
                            <TouchableOpacity style={styles.addQuestionBtn} onPress={handleAddQuestion}>
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                                <Text style={styles.addQuestionText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {questions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="help-circle-outline" size={48} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.emptyText}>No questions yet. Add your first question!</Text>
                            </View>
                        ) : (
                            questions.sort((a, b) => a.order - b.order).map((question, index) => (
                                <Animatable.View
                                    key={question.id}
                                    animation="fadeInUp"
                                    delay={index * 100}
                                    style={styles.questionCard}
                                >
                                    <View style={styles.questionHeader}>
                                        <View style={styles.questionNumber}>
                                            <Text style={styles.questionNumberText}>{question.order}</Text>
                                        </View>
                                        <Text style={styles.questionText} numberOfLines={2}>
                                            {question.question_text}
                                        </Text>
                                    </View>

                                    <View style={styles.optionsPreview}>
                                        {(question.options || []).map((opt, idx) => (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.optionChip,
                                                    question.correct_answer === String.fromCharCode(65 + idx) && styles.correctChip
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.optionChipText,
                                                    question.correct_answer === String.fromCharCode(65 + idx) && styles.correctChipText
                                                ]}>
                                                    {String.fromCharCode(65 + idx)}: {opt.substring(0, 15)}...
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.questionActions}>
                                        <TouchableOpacity
                                            style={styles.iconButton}
                                            onPress={() => handleEditQuestion(question)}
                                        >
                                            <MaterialCommunityIcons name="pencil" size={20} color="#6C63FF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.iconButton}
                                            onPress={() => handleDeleteQuestion(question)}
                                        >
                                            <MaterialCommunityIcons name="delete" size={20} color="#FF6B6B" />
                                        </TouchableOpacity>
                                    </View>
                                </Animatable.View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Quiz Modal */}
            <Modal visible={showQuizModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{quiz ? 'Edit Quiz' : 'Create Quiz'}</Text>
                            <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Quiz Title</Text>
                            <TextInput
                                style={styles.input}
                                value={quizForm.title}
                                onChangeText={(text) => setQuizForm({ ...quizForm, title: text })}
                                placeholder="Enter quiz title"
                                mode="outlined"
                            />

                            <Text style={styles.inputLabel}>Passing Score (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={String(quizForm.passingScore)}
                                onChangeText={(text) => setQuizForm({ ...quizForm, passingScore: parseInt(text) || 70 })}
                                placeholder="70"
                                mode="outlined"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowQuizModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.disabledButton]}
                                onPress={handleSaveQuiz}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Question Modal */}
            <Modal visible={showQuestionModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '95%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingQuestion ? 'Edit Question' : 'Add Question'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowQuestionModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Question *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={questionForm.questionText}
                                onChangeText={(text) => setQuestionForm({ ...questionForm, questionText: text })}
                                placeholder="Enter your question"
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.inputLabel}>Option A *</Text>
                            <TextInput
                                style={styles.input}
                                value={questionForm.optionA}
                                onChangeText={(text) => setQuestionForm({ ...questionForm, optionA: text })}
                                placeholder="First option"
                                mode="outlined"
                            />

                            <Text style={styles.inputLabel}>Option B *</Text>
                            <TextInput
                                style={styles.input}
                                value={questionForm.optionB}
                                onChangeText={(text) => setQuestionForm({ ...questionForm, optionB: text })}
                                placeholder="Second option"
                                mode="outlined"
                            />

                            <Text style={styles.inputLabel}>Option C</Text>
                            <TextInput
                                style={styles.input}
                                value={questionForm.optionC}
                                onChangeText={(text) => setQuestionForm({ ...questionForm, optionC: text })}
                                placeholder="Third option (optional)"
                                mode="outlined"
                            />

                            <Text style={styles.inputLabel}>Option D</Text>
                            <TextInput
                                style={styles.input}
                                value={questionForm.optionD}
                                onChangeText={(text) => setQuestionForm({ ...questionForm, optionD: text })}
                                placeholder="Fourth option (optional)"
                                mode="outlined"
                            />

                            <Text style={styles.inputLabel}>Correct Answer</Text>
                            <View style={styles.answerPicker}>
                                {['A', 'B', 'C', 'D'].map((letter) => (
                                    <TouchableOpacity
                                        key={letter}
                                        style={[
                                            styles.answerOption,
                                            questionForm.correctAnswer === letter && styles.answerOptionActive
                                        ]}
                                        onPress={() => setQuestionForm({ ...questionForm, correctAnswer: letter })}
                                    >
                                        <Text style={[
                                            styles.answerOptionText,
                                            questionForm.correctAnswer === letter && styles.answerOptionTextActive
                                        ]}>
                                            {letter}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Order</Text>
                            <TextInput
                                style={styles.input}
                                value={String(questionForm.order)}
                                onChangeText={(text) => setQuestionForm({ ...questionForm, order: parseInt(text) || 1 })}
                                placeholder="1"
                                mode="outlined"
                                keyboardType="numeric"
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowQuestionModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.disabledButton]}
                                onPress={handleSaveQuestion}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>
                                        {editingQuestion ? 'Update' : 'Add'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 24,
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6C63FF',
        fontWeight: '600',
    },
    createQuizButton: {
        backgroundColor: '#FF6B6B',
        padding: 32,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        alignItems: 'center',
        marginBottom: 20,
    },
    createQuizText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 8,
    },
    quizInfo: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        marginBottom: 20,
    },
    quizHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quizTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    quizMeta: {
        fontSize: 13,
        color: '#636E72',
        marginTop: 4,
    },
    quizActions: {
        flexDirection: 'row',
        gap: 8,
    },
    smallButton: {
        padding: 8,
        backgroundColor: '#F5F6FA',
        borderRadius: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    addQuestionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00B894',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    addQuestionText: {
        color: '#fff',
        fontWeight: 'bold',
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
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        marginBottom: 12,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    questionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    questionNumberText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    questionText: {
        flex: 1,
        fontSize: 14,
        color: '#2D3436',
        lineHeight: 20,
    },
    optionsPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    optionChip: {
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    correctChip: {
        backgroundColor: '#00B894',
    },
    optionChipText: {
        fontSize: 11,
        color: '#636E72',
    },
    correctChipText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    questionActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 12,
    },
    iconButton: {
        padding: 8,
        backgroundColor: '#F5F6FA',
        borderRadius: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    modalBody: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F5F6FA',
        borderRadius: 12,
    },
    textArea: {
        minHeight: 80,
    },
    answerPicker: {
        flexDirection: 'row',
        gap: 12,
    },
    answerOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    answerOptionActive: {
        backgroundColor: '#00B894',
        borderColor: '#00B894',
    },
    answerOptionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#636E72',
    },
    answerOptionTextActive: {
        color: '#fff',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F5F6FA',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#636E72',
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#6C63FF',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
