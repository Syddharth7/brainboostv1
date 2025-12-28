const supabase = require('../config/supabase');

exports.getAllStudents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'student');

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentProgress = async (req, res) => {
    const { studentId } = req.params;
    try {
        // Fetch progress and quiz attempts
        const { data: progress, error: progressError } = await supabase
            .from('user_topic_progress')
            .select('*, topics(title, lesson_id)')
            .eq('user_id', studentId);

        if (progressError) throw progressError;

        const { data: quizzes, error: quizError } = await supabase
            .from('quiz_attempts')
            .select('*, quizzes(title)')
            .eq('user_id', studentId);

        if (quizError) throw quizError;

        res.status(200).json({ progress, quizzes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createLesson = async (req, res) => {
    const { title, category, description, order } = req.body;
    try {
        const { data, error } = await supabase
            .from('lessons')
            .insert([{ title, category, description, order }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
