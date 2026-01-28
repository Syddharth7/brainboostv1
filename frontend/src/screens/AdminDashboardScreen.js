import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, ImageBackground } from 'react-native';
import { Card, Title, Paragraph, Button, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';

// Background image
const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

export default function AdminDashboardScreen({ navigation }) {
    const { user, signOut } = useAuthStore();
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    const teacherName = user?.user_metadata?.username || 'Teacher';

    // Fetch existing announcements
    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const data = await api.announcements.getAll();
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    // Create announcement
    const handleCreate = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in both title and message');
            return;
        }

        setLoading(true);
        try {
            await api.announcements.create(title, message, teacherName, user?.id);
            Alert.alert('Success', 'Announcement created! Push notifications sent to students.');
            setTitle('');
            setMessage('');
            setShowModal(false);
            fetchAnnouncements();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete announcement
    const handleDelete = async (id) => {
        Alert.alert('Delete', 'Are you sure you want to delete this announcement?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.announcements.delete(id);
                        fetchAnnouncements();
                    } catch (error) {
                        Alert.alert('Error', error.message);
                    }
                }
            }
        ]);
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <Animatable.View animation="fadeIn" style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerCard}>
                            <MaterialCommunityIcons name="shield-account" size={32} color="#6C63FF" />
                            <Title style={styles.headerTitle}>Admin Dashboard</Title>
                        </View>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={() => {
                                Alert.alert(
                                    'Logout',
                                    'Are you sure you want to logout?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Logout',
                                            style: 'destructive',
                                            onPress: async () => {
                                                await supabase.auth.signOut();
                                                signOut();
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <MaterialCommunityIcons name="logout" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </Animatable.View>

                {/* Quick Actions Grid */}
                <View style={styles.grid}>
                    {/* Create Announcement Card */}
                    <Animatable.View animation="fadeInUp" delay={100} style={styles.cardWrapper}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => setShowModal(true)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#FF6B6B' }]}>
                                <MaterialCommunityIcons name="bullhorn" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardLabel}>Create Announcement</Text>
                            <Text style={styles.cardSublabel}>Send notification</Text>
                        </TouchableOpacity>
                    </Animatable.View>

                    {/* Students Card */}
                    <Animatable.View animation="fadeInUp" delay={200} style={styles.cardWrapper}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('StudentManagement')}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#6C63FF' }]}>
                                <MaterialCommunityIcons name="account-group" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardLabel}>Students</Text>
                            <Text style={styles.cardSublabel}>View scores</Text>
                        </TouchableOpacity>
                    </Animatable.View>

                    {/* Content Card */}
                    <Animatable.View animation="fadeInUp" delay={300} style={styles.cardWrapper}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('ContentManagement')}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#00B894' }]}>
                                <MaterialCommunityIcons name="book-open-variant" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardLabel}>Content</Text>
                            <Text style={styles.cardSublabel}>Lessons & Quizzes</Text>
                        </TouchableOpacity>
                    </Animatable.View>

                    {/* Analytics Card */}
                    <Animatable.View animation="fadeInUp" delay={400} style={styles.cardWrapper}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Analytics')}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#FFD700' }]}>
                                <MaterialCommunityIcons name="chart-line" size={28} color="#fff" />
                            </View>
                            <Text style={styles.cardLabel}>Analytics</Text>
                            <Text style={styles.cardSublabel}>Class progress</Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </View>

                {/* Recent Announcements */}
                <Animatable.View animation="fadeInUp" delay={500} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
                        <Text style={styles.sectionTitle}>Recent Announcements</Text>
                    </View>

                    {loadingAnnouncements ? (
                        <ActivityIndicator color="#6C63FF" style={{ marginTop: 20 }} />
                    ) : announcements.length > 0 ? (
                        announcements.slice(0, 5).map((ann, index) => (
                            <View key={ann.id} style={styles.announcementItem}>
                                <View style={styles.announcementContent}>
                                    <Text style={styles.announcementTitle}>{ann.title}</Text>
                                    <Text style={styles.announcementMessage} numberOfLines={2}>{ann.message}</Text>
                                    <Text style={styles.announcementDate}>{formatDate(ann.created_at)}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDelete(ann.id)}
                                    style={styles.deleteButton}
                                >
                                    <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No announcements yet</Text>
                        </View>
                    )}
                </Animatable.View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Create Announcement Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animatable.View animation="slideInUp" style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Title style={styles.modalTitle}>Create Announcement</Title>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., Quiz Reminder"
                            mode="outlined"
                            style={styles.input}
                            theme={{ roundness: 12 }}
                        />

                        <Text style={styles.inputLabel}>Message</Text>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Enter your announcement..."
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={[styles.input, styles.textArea]}
                            theme={{ roundness: 12 }}
                        />

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="information-outline" size={16} color="#636E72" />
                            <Text style={styles.infoText}>
                                This will send a push notification to all students.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={loading}
                            style={[styles.submitButton, loading && styles.disabledButton]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="send" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Send Announcement</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animatable.View>
                </View>
            </Modal>
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
        paddingTop: 60,
        paddingHorizontal: 16,
    },
    // Header
    header: {
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        gap: 12,
        flex: 1,
        marginRight: 12,
    },
    logoutButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    cardWrapper: {
        width: '47%',
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        alignItems: 'center',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3436',
        textAlign: 'center',
    },
    cardSublabel: {
        fontSize: 11,
        color: '#636E72',
        textAlign: 'center',
        marginTop: 2,
    },
    // Section
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Announcements
    announcementItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        padding: 14,
        marginBottom: 10,
    },
    announcementContent: {
        flex: 1,
    },
    announcementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    announcementMessage: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 4,
    },
    announcementDate: {
        fontSize: 10,
        color: '#B2BEC3',
    },
    deleteButton: {
        padding: 4,
    },
    emptyState: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 100,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 12,
        color: '#636E72',
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6C63FF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingVertical: 14,
        gap: 8,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#B2BEC3',
    },
});
