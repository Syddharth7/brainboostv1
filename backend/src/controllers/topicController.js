const supabase = require('../config/supabase');

exports.getTopicsByLessonId = async (req, res) => {
    const { lessonId } = req.params;
    try {
        const { data, error } = await supabase
            .from('topics')
            .select('*')
            .eq('lesson_id', lessonId)
            .order('order', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markTopicComplete = async (req, res) => {
    const { userId, topicId } = req.body;
    try {
        const { data, error } = await supabase
            .from('user_topic_progress')
            .upsert({
                user_id: userId,
                topic_id: topicId,
                completed: true,
                completed_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
