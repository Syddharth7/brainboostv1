import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, RefreshControl, ImageBackground } from 'react-native';
import { Text, TextInput, ActivityIndicator, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';

const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

export default function LessonContentEditorScreen({ navigation, route }) {
    const { lesson } = route.params;
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Topic modal state
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicForm, setTopicForm] = useState({
        title: '',
        content: '',
        order: 1,
        estimatedTime: 10
    });
    const [saving, setSaving] = useState(false);

    // Fetch topics
    const fetchTopics = useCallback(async () => {
        try {
            const data = await api.topics.getByLessonId(lesson.id);
            setTopics(data || []);
        } catch (error) {
            console.error('Error fetching topics:', error);
            Alert.alert('Error', 'Failed to load topics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [lesson.id]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTopics();
    };

    // Add topic
    const handleAddTopic = () => {
        setEditingTopic(null);
        setTopicForm({ title: '', content: '', order: topics.length + 1, estimatedTime: 10 });
        setShowTopicModal(true);
    };

    // Edit topic
    const handleEditTopic = (topic) => {
        setEditingTopic(topic);
        setTopicForm({
            title: topic.title,
            content: topic.content || '',
            order: topic.order,
            estimatedTime: topic.estimated_time || 10
        });
        setShowTopicModal(true);
    };

    // Save topic
    const handleSaveTopic = async () => {
        if (!topicForm.title.trim()) {
            Alert.alert('Error', 'Title is required');
            return;
        }

        setSaving(true);
        try {
            if (editingTopic) {
                await api.topics.update(editingTopic.id, {
                    title: topicForm.title,
                    content: topicForm.content,
                    order: topicForm.order,
                    estimated_time: topicForm.estimatedTime
                });
                Alert.alert('Success', 'Topic updated');
            } else {
                await api.topics.create(
                    lesson.id,
                    topicForm.title,
                    topicForm.content,
                    topicForm.order,
                    topicForm.estimatedTime
                );
                Alert.alert('Success', 'Topic created');
            }
            setShowTopicModal(false);
            fetchTopics();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    // Delete topic
    const handleDeleteTopic = (topic) => {
        Alert.alert(
            'Delete Topic',
            `Are you sure you want to delete "${topic.title}"? This will also delete any quizzes.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.topics.delete(topic.id);
                            fetchTopics();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    // Navigate to quiz editor
    const handleManageQuiz = (topic) => {
        navigation.navigate('QuizEditor', { topic, lesson });
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
                        <Title style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Title>
                        <Text style={styles.headerSubtitle}>{lesson.category}</Text>
                    </View>
                </Animatable.View>

                {/* Add Topic Button */}
                <TouchableOpacity style={styles.addButton} onPress={handleAddTopic}>
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Topic</Text>
                </TouchableOpacity>

                {/* Topics List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={18} color="#fff" /> Topics ({topics.length})
                    </Text>

                    {topics.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="file-document-outline" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyText}>No topics yet. Add your first topic!</Text>
                        </View>
                    ) : (
                        topics.map((topic, index) => (
                            <Animatable.View
                                key={topic.id}
                                animation="fadeInUp"
                                delay={index * 100}
                                style={styles.topicCard}
                            >
                                <View style={styles.topicContent}>
                                    <View style={styles.topicInfo}>
                                        <View style={styles.topicHeader}>
                                            <View style={styles.orderBadge}>
                                                <Text style={styles.orderText}>{topic.order}</Text>
                                            </View>
                                            <Text style={styles.topicTitle}>{topic.title}</Text>
                                        </View>
                                        <View style={styles.topicMeta}>
                                            <MaterialCommunityIcons name="clock-outline" size={14} color="#636E72" />
                                            <Text style={styles.metaText}>{topic.estimated_time || 10} min</Text>
                                        </View>
                                        {topic.content && (
                                            <Text style={styles.topicDescription} numberOfLines={2}>
                                                {topic.content.substring(0, 100)}...
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.topicActions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleManageQuiz(topic)}
                                        >
                                            <MaterialCommunityIcons name="help-circle" size={18} color="#fff" />
                                            <Text style={styles.actionButtonText}>Quiz</Text>
                                        </TouchableOpacity>
                                        <View style={styles.iconRow}>
                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={() => handleEditTopic(topic)}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={20} color="#6C63FF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={() => handleDeleteTopic(topic)}
                                            >
                                                <MaterialCommunityIcons name="delete" size={20} color="#FF6B6B" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </Animatable.View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Topic Modal */}
            <Modal visible={showTopicModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingTopic ? 'Edit Topic' : 'New Topic'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowTopicModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={topicForm.title}
                                onChangeText={(text) => setTopicForm({ ...topicForm, title: text })}
                                placeholder="Enter topic title"
                                mode="outlined"
                            />

                            <Text style={styles.inputLabel}>Content (Markdown supported)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={topicForm.content}
                                onChangeText={(text) => setTopicForm({ ...topicForm, content: text })}
                                placeholder="Enter topic content..."
                                mode="outlined"
                                multiline
                                numberOfLines={8}
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.inputLabel}>Order</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(topicForm.order)}
                                        onChangeText={(text) => setTopicForm({ ...topicForm, order: parseInt(text) || 1 })}
                                        placeholder="1"
                                        mode="outlined"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.inputLabel}>Est. Time (min)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(topicForm.estimatedTime)}
                                        onChangeText={(text) => setTopicForm({ ...topicForm, estimatedTime: parseInt(text) || 10 })}
                                        placeholder="10"
                                        mode="outlined"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowTopicModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.disabledButton]}
                                onPress={handleSaveTopic}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>
                                        {editingTopic ? 'Update' : 'Create'}
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6C63FF',
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00B894',
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
    topicCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        marginBottom: 12,
        overflow: 'hidden',
    },
    topicContent: {
        padding: 16,
    },
    topicInfo: {
        marginBottom: 12,
    },
    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    orderText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    topicTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        flex: 1,
    },
    topicMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 38,
    },
    metaText: {
        fontSize: 12,
        color: '#636E72',
    },
    topicDescription: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 8,
        marginLeft: 38,
    },
    topicActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    iconRow: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 8,
        backgroundColor: '#F5F6FA',
        borderRadius: 8,
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
        maxHeight: '90%',
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
        minHeight: 150,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
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
