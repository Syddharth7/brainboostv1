import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Alert, Share, Platform } from 'react-native';
import { Title, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { api } from '../services/api';

const DASHBOARD_BG = require('../../assets/images/dashboard_bg.jpg');

export default function StudentManagementScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [showLessonPicker, setShowLessonPicker] = useState(false);
    const [scores, setScores] = useState({});

    const sections = ['A', 'B', 'C', 'D', 'Unassigned'];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedLesson) {
            fetchScoresForLesson(selectedLesson.id);
        }
    }, [selectedLesson]);

    const fetchData = async () => {
        try {
            // Fetch students
            const studentsData = await api.students.getAll();
            console.log('Students fetched:', studentsData?.length, studentsData);
            setStudents(studentsData || []);

            // Fetch lessons
            const lessonsData = await api.lessons.getAll();
            console.log('Lessons fetched:', lessonsData?.length);
            setLessons(lessonsData || []);

            if (lessonsData && lessonsData.length > 0) {
                setSelectedLesson(lessonsData[0]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchScoresForLesson = async (lessonId) => {
        try {
            // Try to fetch quizzes directly by lesson_id first
            let quizzesData = await api.quizzes.getByLessonId(lessonId);
            console.log('Quizzes by lesson_id:', quizzesData?.length);

            // If no direct quizzes, fetch via topics
            if (!quizzesData || quizzesData.length === 0) {
                quizzesData = await api.quizzes.getAllByLessonIdViaTopics(lessonId);
                console.log('Quizzes via topics:', quizzesData?.length);
            }

            console.log('Final quizzes:', quizzesData?.length, quizzesData);
            setQuizzes(quizzesData || []);

            // Fetch all quiz progress
            const allProgress = await api.progress.getAllQuizProgress();
            console.log('All quiz progress:', allProgress?.length, allProgress);

            // Organize scores by student and quiz
            const organizedScores = {};
            (allProgress || []).forEach(progress => {
                if (!organizedScores[progress.user_id]) {
                    organizedScores[progress.user_id] = {};
                }
                organizedScores[progress.user_id][progress.quiz_id] = progress.score;
            });
            console.log('Organized scores:', organizedScores);
            setScores(organizedScores);
        } catch (error) {
            console.error('Error fetching scores:', error);
        }
    };

    const getStudentsBySection = (section) => {
        return students.filter(s => (s.section || 'Unassigned') === section);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getStudentScore = (studentId, quizId) => {
        return scores[studentId]?.[quizId] ?? '-';
    };

    // Export to PDF
    const exportToPDF = async () => {
        if (!selectedLesson || quizzes.length === 0) {
            Alert.alert('Error', 'Please select a lesson with quizzes first');
            return;
        }

        let html = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #6C63FF; text-align: center; }
                    h2 { color: #2D3436; margin-top: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #6C63FF; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>Student Scores Report</h1>
                <p><strong>Lesson:</strong> ${selectedLesson.title}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        `;

        sections.forEach(section => {
            const sectionStudents = getStudentsBySection(section);
            if (sectionStudents.length > 0) {
                html += `<h2>${section}</h2>`;
                html += `<table><tr><th>Student</th>`;
                quizzes.forEach((q, i) => {
                    html += `<th>T${i + 1}</th>`;
                });
                html += `<th>Avg</th></tr>`;

                sectionStudents.forEach(student => {
                    html += `<tr><td>${student.username || student.email}</td>`;
                    let total = 0;
                    let count = 0;
                    quizzes.forEach(quiz => {
                        const score = getStudentScore(student.id, quiz.id);
                        html += `<td>${score}</td>`;
                        if (score !== '-') {
                            total += score;
                            count++;
                        }
                    });
                    const avg = count > 0 ? Math.round(total / count) : '-';
                    html += `<td><strong>${avg}</strong></td></tr>`;
                });
                html += `</table>`;
            }
        });

        html += `</body></html>`;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Error', 'Failed to export PDF');
            console.error(error);
        }
    };

    // Export to CSV (Excel compatible)
    const exportToExcel = async () => {
        if (!selectedLesson || quizzes.length === 0) {
            Alert.alert('Error', 'Please select a lesson with quizzes first');
            return;
        }

        let csv = `Student Scores Report - ${selectedLesson.title}\n\n`;
        csv += `Section,Student,${quizzes.map((q, i) => `Topic ${i + 1}`).join(',')},Average\n`;

        sections.forEach(section => {
            const sectionStudents = getStudentsBySection(section);
            sectionStudents.forEach(student => {
                let total = 0;
                let count = 0;
                const scoresList = quizzes.map(quiz => {
                    const score = getStudentScore(student.id, quiz.id);
                    if (score !== '-') {
                        total += score;
                        count++;
                    }
                    return score;
                });
                const avg = count > 0 ? Math.round(total / count) : '-';
                csv += `${section},"${student.username || student.email}",${scoresList.join(',')},${avg}\n`;
            });
        });

        try {
            const fileUri = FileSystem.documentDirectory + `scores_${selectedLesson.title.replace(/\s/g, '_')}.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csv);
            await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
        } catch (error) {
            Alert.alert('Error', 'Failed to export CSV');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground source={DASHBOARD_BG} style={styles.container} resizeMode="cover">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Title style={styles.headerTitle}>Student Management</Title>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Lesson Picker */}
                <Animatable.View animation="fadeInDown" style={styles.lessonPickerContainer}>
                    <Text style={styles.pickerLabel}>📚 Select Lesson</Text>
                    <TouchableOpacity
                        style={styles.lessonPicker}
                        onPress={() => setShowLessonPicker(!showLessonPicker)}
                    >
                        <Text style={styles.lessonPickerText}>
                            {selectedLesson?.title || 'Select a lesson'}
                        </Text>
                        <MaterialCommunityIcons
                            name={showLessonPicker ? "chevron-up" : "chevron-down"}
                            size={24}
                            color="#6C63FF"
                        />
                    </TouchableOpacity>

                    {showLessonPicker && (
                        <View style={styles.lessonOptions}>
                            {lessons.map(lesson => (
                                <TouchableOpacity
                                    key={lesson.id}
                                    style={[
                                        styles.lessonOption,
                                        selectedLesson?.id === lesson.id && styles.lessonOptionSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedLesson(lesson);
                                        setShowLessonPicker(false);
                                    }}
                                >
                                    <Text style={styles.lessonOptionText}>{lesson.title}</Text>
                                    {selectedLesson?.id === lesson.id && (
                                        <MaterialCommunityIcons name="check" size={20} color="#6C63FF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </Animatable.View>

                {/* Sections and Students */}
                {sections.map((section, idx) => {
                    const sectionStudents = getStudentsBySection(section);
                    if (sectionStudents.length === 0) return null;

                    return (
                        <Animatable.View
                            key={section}
                            animation="fadeInUp"
                            delay={100 * idx}
                            style={styles.sectionContainer}
                        >
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => toggleSection(section)}
                            >
                                <View style={styles.sectionTitleRow}>
                                    <MaterialCommunityIcons
                                        name="account-group"
                                        size={22}
                                        color="#6C63FF"
                                    />
                                    <Text style={styles.sectionTitle}>{section}</Text>
                                    <Text style={styles.studentCount}>({sectionStudents.length})</Text>
                                </View>
                                <MaterialCommunityIcons
                                    name={expandedSections[section] ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color="#636E72"
                                />
                            </TouchableOpacity>

                            {expandedSections[section] && (
                                <View style={styles.scoresTable}>
                                    {/* Table Header */}
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.tableCell, styles.studentCell]}>Student</Text>
                                        {quizzes.slice(0, 5).map((quiz, i) => (
                                            <Text key={quiz.id} style={styles.tableCell}>T{i + 1}</Text>
                                        ))}
                                        <Text style={[styles.tableCell, styles.avgCell]}>Avg</Text>
                                    </View>

                                    {/* Student Rows */}
                                    {sectionStudents.map(student => {
                                        let total = 0;
                                        let count = 0;
                                        return (
                                            <View key={student.id} style={styles.tableRow}>
                                                <Text style={[styles.tableCell, styles.studentCell]} numberOfLines={1}>
                                                    {student.username || student.email?.split('@')[0]}
                                                </Text>
                                                {quizzes.slice(0, 5).map(quiz => {
                                                    const score = getStudentScore(student.id, quiz.id);
                                                    if (score !== '-') {
                                                        total += score;
                                                        count++;
                                                    }
                                                    return (
                                                        <Text
                                                            key={quiz.id}
                                                            style={[
                                                                styles.tableCell,
                                                                score !== '-' && score >= 70 ? styles.passScore :
                                                                    score !== '-' ? styles.failScore : null
                                                            ]}
                                                        >
                                                            {score}
                                                        </Text>
                                                    );
                                                })}
                                                <Text style={[styles.tableCell, styles.avgCell]}>
                                                    {count > 0 ? Math.round(total / count) : '-'}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </Animatable.View>
                    );
                })}

                {/* Export Buttons */}
                <Animatable.View animation="fadeInUp" delay={500} style={styles.exportContainer}>
                    <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
                        <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FF6B6B" />
                        <Text style={styles.exportButtonText}>Export PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
                        <MaterialCommunityIcons name="microsoft-excel" size={24} color="#00B894" />
                        <Text style={styles.exportButtonText}>Export Excel</Text>
                    </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    // Lesson Picker
    lessonPickerContainer: {
        marginBottom: 20,
    },
    pickerLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    lessonPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        padding: 16,
    },
    lessonPickerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    lessonOptions: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginTop: 8,
        overflow: 'hidden',
    },
    lessonOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    lessonOptionSelected: {
        backgroundColor: '#EEF2FF',
    },
    lessonOptionText: {
        fontSize: 15,
        color: '#2D3436',
    },
    // Sections
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#2D3436',
        marginBottom: 12,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F8F9FA',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    studentCount: {
        fontSize: 14,
        color: '#636E72',
    },
    // Scores Table
    scoresTable: {
        padding: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#6C63FF',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        color: '#2D3436',
    },
    studentCell: {
        flex: 2,
        textAlign: 'left',
        fontWeight: '500',
    },
    avgCell: {
        fontWeight: 'bold',
    },
    passScore: {
        color: '#00B894',
        fontWeight: '600',
    },
    failScore: {
        color: '#FF6B6B',
        fontWeight: '600',
    },
    // Export
    exportContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 20,
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3436',
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 8,
    },
    exportButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
});
