import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl, ImageBackground } from 'react-native';
import { Text, TextInput, ActivityIndicator, Title, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { api } from '../services/api';

const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

const CATEGORIES = ['ICT', 'Agriculture', 'Industrial Arts', 'Tourism'];

export default function AnalyticsScreen({ navigation }) {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSection, setSelectedSection] = useState('All');

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            const [studentsData, sectionsData] = await Promise.all([
                api.analytics.getStudentsWithScores(),
                api.analytics.getSections()
            ]);
            setStudents(studentsData);
            setFilteredStudents(studentsData);
            setSections(['All', ...sectionsData]);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            Alert.alert('Error', 'Failed to load analytics data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter students
    useEffect(() => {
        let result = students;

        // Filter by section
        if (selectedSection !== 'All') {
            result = result.filter(s => s.section === selectedSection);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.username?.toLowerCase().includes(query) ||
                s.email?.toLowerCase().includes(query)
            );
        }

        setFilteredStudents(result);
    }, [students, selectedSection, searchQuery]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Get top performers (top 5 with scores)
    const topPerformers = [...students]
        .filter(s => s.quizCount > 0)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

    // Get students needing attention (lowest 5 with scores)
    const needsAttention = [...students]
        .filter(s => s.quizCount > 0)
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 5);

    const getScoreColor = (score) => {
        if (score >= 80) return '#00B894';
        if (score >= 60) return '#FDCB6E';
        return '#FF6B6B';
    };

    const handleViewStudent = (student) => {
        navigation.navigate('StudentProgress', { studentId: student.id, studentName: student.username });
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
                        <Title style={styles.headerTitle}>Student Analytics</Title>
                        <Text style={styles.headerSubtitle}>{students.length} Students</Text>
                    </View>
                </Animatable.View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#636E72" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#B2BEC3"
                    />
                </View>

                {/* Section Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
                    {sections.map((section) => (
                        <TouchableOpacity
                            key={section}
                            style={[
                                styles.filterChip,
                                selectedSection === section && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedSection(section)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedSection === section && styles.filterChipTextActive
                            ]}>
                                {section}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Top Performers */}
                {topPerformers.length > 0 && (
                    <Animatable.View animation="fadeInUp" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                            <Text style={styles.sectionTitle}>Top Performers</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {topPerformers.map((student, index) => (
                                <TouchableOpacity
                                    key={student.id}
                                    style={styles.performerCard}
                                    onPress={() => handleViewStudent(student)}
                                >
                                    <View style={styles.rankBadge}>
                                        <Text style={styles.rankText}>#{index + 1}</Text>
                                    </View>
                                    <Avatar.Text
                                        size={48}
                                        label={student.username?.substring(0, 2).toUpperCase() || '??'}
                                        style={{ backgroundColor: '#6C63FF' }}
                                    />
                                    <Text style={styles.performerName} numberOfLines={1}>
                                        {student.username || 'Unknown'}
                                    </Text>
                                    <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(student.avgScore) }]}>
                                        <Text style={styles.scoreText}>{student.avgScore}%</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animatable.View>
                )}

                {/* Needs Attention */}
                {needsAttention.length > 0 && needsAttention[0].avgScore < 70 && (
                    <Animatable.View animation="fadeInUp" delay={100} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6B6B" />
                            <Text style={styles.sectionTitle}>Needs Attention</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {needsAttention.filter(s => s.avgScore < 70).map((student) => (
                                <TouchableOpacity
                                    key={student.id}
                                    style={[styles.performerCard, styles.attentionCard]}
                                    onPress={() => handleViewStudent(student)}
                                >
                                    <Avatar.Text
                                        size={48}
                                        label={student.username?.substring(0, 2).toUpperCase() || '??'}
                                        style={{ backgroundColor: '#FF6B6B' }}
                                    />
                                    <Text style={styles.performerName} numberOfLines={1}>
                                        {student.username || 'Unknown'}
                                    </Text>
                                    <View style={[styles.scoreBadge, { backgroundColor: '#FF6B6B' }]}>
                                        <Text style={styles.scoreText}>{student.avgScore}%</Text>
                                    </View>
                                    {student.weakestCategory && (
                                        <Text style={styles.weakCategory}>
                                            <MaterialCommunityIcons name="arrow-down" size={10} color="#FF6B6B" />
                                            {student.weakestCategory.name}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animatable.View>
                )}

                {/* All Students */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
                        <Text style={styles.sectionTitle}>
                            All Students ({filteredStudents.length})
                        </Text>
                    </View>

                    {filteredStudents.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-search" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyText}>No students found</Text>
                        </View>
                    ) : (
                        filteredStudents.map((student, index) => (
                            <Animatable.View
                                key={student.id}
                                animation="fadeInUp"
                                delay={index * 50}
                            >
                                <TouchableOpacity
                                    style={styles.studentCard}
                                    onPress={() => handleViewStudent(student)}
                                >
                                    <View style={styles.studentMain}>
                                        <Avatar.Text
                                            size={44}
                                            label={student.username?.substring(0, 2).toUpperCase() || '??'}
                                            style={{ backgroundColor: getScoreColor(student.avgScore) }}
                                        />
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{student.username || 'Unknown'}</Text>
                                            <Text style={styles.studentSection}>
                                                <MaterialCommunityIcons name="school" size={12} color="#636E72" /> {student.section || 'No Section'}
                                            </Text>
                                            {student.weakestCategory && student.avgScore < 80 && (
                                                <View style={styles.weakBadge}>
                                                    <MaterialCommunityIcons name="alert" size={10} color="#FF6B6B" />
                                                    <Text style={styles.weakBadgeText}>
                                                        Weak: {student.weakestCategory.name} ({student.weakestCategory.score}%)
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.studentRight}>
                                        <View style={[styles.avgScoreBadge, { backgroundColor: getScoreColor(student.avgScore) }]}>
                                            <Text style={styles.avgScoreText}>{student.avgScore}%</Text>
                                        </View>
                                        <Text style={styles.quizCount}>{student.quizCount} quizzes</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color="#B2BEC3" />
                                    </View>
                                </TouchableOpacity>
                            </Animatable.View>
                        ))
                    )}
                </View>
            </ScrollView>
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
        marginBottom: 20,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6C63FF',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#2D3436',
    },
    filtersContainer: {
        marginBottom: 16,
    },
    filterChip: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    filterChipActive: {
        backgroundColor: '#6C63FF',
        borderColor: '#fff',
    },
    filterChipText: {
        color: '#fff',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    performerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
        marginRight: 12,
        alignItems: 'center',
        width: 110,
    },
    attentionCard: {
        borderColor: '#FF6B6B',
    },
    rankBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#FFD700',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    rankText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    performerName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2D3436',
        marginTop: 8,
        textAlign: 'center',
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    scoreText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    weakCategory: {
        fontSize: 10,
        color: '#FF6B6B',
        marginTop: 4,
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
    studentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    studentMain: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    studentInfo: {
        marginLeft: 12,
        flex: 1,
    },
    studentName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    studentSection: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    weakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3F3',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 4,
        gap: 4,
        alignSelf: 'flex-start',
    },
    weakBadgeText: {
        fontSize: 10,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    studentRight: {
        alignItems: 'flex-end',
    },
    avgScoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    avgScoreText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    quizCount: {
        fontSize: 11,
        color: '#636E72',
        marginTop: 4,
    },
});
