import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, RefreshControl, ImageBackground } from 'react-native';
import { Text, TextInput, ActivityIndicator, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';

const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

const CATEGORIES = ['ICT', 'Agriculture', 'Industrial Arts', 'Tourism'];

export default function ContentManagementScreen({ navigation }) {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        category: 'ICT',
        description: '',
        order: 1
    });
    const [saving, setSaving] = useState(false);

    // Fetch lessons
    const fetchLessons = useCallback(async () => {
        try {
            const data = await api.lessons.getAll();
            setLessons(data || []);
        } catch (error) {
            console.error('Error fetching lessons:', error);
            Alert.alert('Error', 'Failed to load lessons');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLessons();
    };

    // Open modal for new lesson
    const handleAddLesson = () => {
        setEditingLesson(null);
        setLessonForm({ title: '', category: 'ICT', description: '', order: lessons.length + 1 });
        setShowLessonModal(true);
    };

    // Open modal for editing
    const handleEditLesson = (lesson) => {
        setEditingLesson(lesson);
        setLessonForm({
            title: lesson.title,
            category: lesson.category,
            description: lesson.description || '',
            order: lesson.order
        });
        setShowLessonModal(true);
    };

    // Save lesson
    const handleSaveLesson = async () => {
        if (!lessonForm.title.trim()) {
            Alert.alert('Error', 'Title is required');
            return;
        }

        setSaving(true);
        try {
            if (editingLesson) {
                await api.lessons.update(editingLesson.id, {
                    title: lessonForm.title,
                    category: lessonForm.category,
                    description: lessonForm.description,
                    order: lessonForm.order
                });
                Alert.alert('Success', 'Lesson updated');
            } else {
                await api.lessons.create(
                    lessonForm.title,
                    lessonForm.category,
                    lessonForm.description,
                    lessonForm.order
                );
                Alert.alert('Success', 'Lesson created');
            }
            setShowLessonModal(false);
            fetchLessons();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    // Delete lesson
    const handleDeleteLesson = (lesson) => {
        Alert.alert(
            'Delete Lesson',
            `Are you sure you want to delete "${lesson.title}"? This will also delete all topics and quizzes.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.lessons.delete(lesson.id);
                            fetchLessons();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    // Navigate to topics/quizzes
    const handleViewLesson = (lesson) => {
        navigation.navigate('LessonContentEditor', { lesson });
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
                    <Title style={styles.headerTitle}>Content Management</Title>
                </Animatable.View>

                {/* Add Button */}
                <TouchableOpacity style={styles.addButton} onPress={handleAddLesson}>
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Lesson</Text>
                </TouchableOpacity>

                {/* Lessons List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <MaterialCommunityIcons name="book-open-variant" size={18} color="#fff" /> Lessons ({lessons.length})
                    </Text>

                    {lessons.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="book-off" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyText}>No lessons yet. Add your first lesson!</Text>
                        </View>
                    ) : (
                        lessons.map((lesson, index) => (
                            <Animatable.View
                                key={lesson.id}
                                animation="fadeInUp"
                                delay={index * 100}
                                style={styles.lessonCard}
                            >
                                <TouchableOpacity
                                    style={styles.lessonContent}
                                    onPress={() => handleViewLesson(lesson)}
                                >
                                    <View style={styles.lessonInfo}>
                                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>{lesson.category}</Text>
                                        </View>
                                        {lesson.description && (
                                            <Text style={styles.lessonDescription} numberOfLines={2}>
                                                {lesson.description}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.lessonActions}>
                                        <TouchableOpacity
                                            style={styles.iconButton}
                                            onPress={() => handleEditLesson(lesson)}
                                        >
                                            <MaterialCommunityIcons name="pencil" size={20} color="#6C63FF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.iconButton}
                                            onPress={() => handleDeleteLesson(lesson)}
                                        >
                                            <MaterialCommunityIcons name="delete" size={20} color="#FF6B6B" />
                                        </TouchableOpacity>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color="#B2BEC3" />
                                    </View>
                                </TouchableOpacity>
                            </Animatable.View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Lesson Modal */}
            <Modal visible={showLessonModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingLesson ? 'Edit Lesson' : 'New Lesson'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowLessonModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={lessonForm.title}
                                onChangeText={(text) => setLessonForm({ ...lessonForm, title: text })}
                                placeholder="Enter lesson title"
                                mode="outlined"
                            />

                            <Text style={styles.inputLabel}>Category *</Text>
                            <View style={styles.categoryPicker}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryOption,
                                            lessonForm.category === cat && styles.categoryOptionActive
                                        ]}
                                        onPress={() => setLessonForm({ ...lessonForm, category: cat })}
                                    >
                                        <Text style={[
                                            styles.categoryOptionText,
                                            lessonForm.category === cat && styles.categoryOptionTextActive
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={lessonForm.description}
                                onChangeText={(text) => setLessonForm({ ...lessonForm, description: text })}
                                placeholder="Enter lesson description"
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                            />

                            <Text style={styles.inputLabel}>Order</Text>
                            <TextInput
                                style={styles.input}
                                value={String(lessonForm.order)}
                                onChangeText={(text) => setLessonForm({ ...lessonForm, order: parseInt(text) || 1 })}
                                placeholder="1"
                                mode="outlined"
                                keyboardType="numeric"
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowLessonModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.disabledButton]}
                                onPress={handleSaveLesson}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>
                                        {editingLesson ? 'Update' : 'Create'}
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6C63FF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        marginBottom: 20,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
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
    lessonCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        marginBottom: 12,
        overflow: 'hidden',
    },
    lessonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    categoryBadge: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    categoryText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    lessonDescription: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 4,
    },
    lessonActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        padding: 8,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
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
        minHeight: 100,
    },
    categoryPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F5F6FA',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    categoryOptionActive: {
        backgroundColor: '#6C63FF',
        borderColor: '#6C63FF',
    },
    categoryOptionText: {
        color: '#636E72',
        fontWeight: '600',
    },
    categoryOptionTextActive: {
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
