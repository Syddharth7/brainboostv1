const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('Starting seed...');

    // 1. Create Lessons
    const lessonsData = [
        { title: 'ICT', category: 'ICT', description: 'Information & Communication Tech', order: 1 },
        { title: 'Agriculture', category: 'Agriculture', description: 'Farming & Sustainable Growth', order: 2 },
        { title: 'Industrial Arts', category: 'Industrial Arts', description: 'Manufacturing & Design', order: 3 },
        { title: 'Tourism', category: 'Tourism', description: 'Travel & Hospitality', order: 4 },
    ];

    let lessons = [];
    for (const l of lessonsData) {
        const { data, error } = await supabase.from('lessons').insert(l).select().single();
        if (error) {
            console.error('Error creating lesson:', error.message);
        } else {
            lessons.push(data);
            console.log(`Created lesson: ${data.title}`);
        }
    }

    // 2. Create Topics for ICT (Lesson 1)
    if (lessons.length > 0) {
        const ictLesson = lessons.find(l => l.category === 'ICT');
        if (ictLesson) {
            const topicsData = [
                { lesson_id: ictLesson.id, title: 'Introduction to ICT', content: 'ICT stands for Information and Communication Technology...', order: 1, estimated_time: 5 },
                { lesson_id: ictLesson.id, title: 'Computer Hardware', content: 'Hardware refers to the physical components of a computer...', order: 2, estimated_time: 10 },
                { lesson_id: ictLesson.id, title: 'Software Basics', content: 'Software is a collection of instructions...', order: 3, estimated_time: 8 },
            ];

            for (const t of topicsData) {
                const { error } = await supabase.from('topics').insert(t);
                if (error) console.error('Error creating topic:', error.message);
                else console.log(`Created topic: ${t.title}`);
            }

            // 3. Create Quiz for ICT
            const { data: quiz, error: quizError } = await supabase.from('quizzes').insert({
                lesson_id: ictLesson.id,
                title: 'ICT Fundamentals Quiz',
                passing_score: 70
            }).select().single();

            if (quizError) {
                console.error('Error creating quiz:', quizError.message);
            } else {
                console.log(`Created quiz: ${quiz.title}`);

                // 4. Create Questions
                const questionsData = [
                    {
                        quiz_id: quiz.id,
                        question_text: 'What does CPU stand for?',
                        options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Process Utility', 'Central Processor Unit'],
                        correct_answer: 'Central Processing Unit',
                        order: 1
                    },
                    {
                        quiz_id: quiz.id,
                        question_text: 'Which of the following is an input device?',
                        options: ['Monitor', 'Printer', 'Keyboard', 'Speaker'],
                        correct_answer: 'Keyboard',
                        order: 2
                    }
                ];

                for (const q of questionsData) {
                    const { error } = await supabase.from('quiz_questions').insert(q);
                    if (error) console.error('Error creating question:', error.message);
                }
                console.log('Created quiz questions');
            }
        }
    }

    // 5. Create Achievements
    const achievementsData = [
        { title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', condition_type: 'lesson_count', condition_value: 1 },
        { title: 'Quiz Master', description: 'Score 100% on a quiz', icon: '🏆', condition_type: 'perfect_score', condition_value: 1 },
        { title: 'On Fire', description: 'Reach a 3-day streak', icon: '🔥', condition_type: 'streak_days', condition_value: 3 },
        { title: 'Scholar', description: 'Complete 5 topics', icon: '📚', condition_type: 'topic_count', condition_value: 5 },
    ];

    for (const a of achievementsData) {
        const { error } = await supabase.from('achievements').insert(a);
        if (error) console.error('Error creating achievement:', error.message);
        else console.log(`Created achievement: ${a.title}`);
    }

    console.log('Seed completed!');
}

seed();
