import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

export default function AdminDashboardScreen() {
    return (
        <ScrollView style={styles.container}>
            <Title style={styles.header}>Admin Dashboard</Title>

            <View style={styles.grid}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Students</Title>
                        <Paragraph>Manage enrolled students</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button>View</Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Content</Title>
                        <Paragraph>Manage lessons & quizzes</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button>Edit</Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Analytics</Title>
                        <Paragraph>View class progress</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button>View</Button>
                    </Card.Actions>
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        marginBottom: 16,
    },
});
