const supabase = require('../config/supabase');

exports.getQuizByLessonId = async (req, res) => {
    const { lessonId } = req.params;
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*, quiz_questions(*)')
            .eq('lesson_id', lessonId)
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

exports.getQuizByTopicId = async (req, res) => {
    const { topicId } = req.params;
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*, quiz_questions(*)')
            .eq('topic_id', topicId)
            .maybeSingle();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

exports.submitQuizAttempt = async (req, res) => {
    const { userId, quizId, score, answers } = req.body;
    try {
        // 1. Record the attempt
        const { data, error } = await supabase
            .from('quiz_attempts')
            .insert([
                { user_id: userId, quiz_id: quizId, score, answers }
            ])
            .select()
            .single();

        if (error) throw error;

        // 2. Check if passed and unlock next lesson (logic can be here or client side trigger)
        // For now, we just return the result.

        res.status(201).json({ message: 'Quiz submitted successfully', attempt: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
