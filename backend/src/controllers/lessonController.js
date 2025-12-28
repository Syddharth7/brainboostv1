const supabase = require('../config/supabase');

exports.getAllLessons = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLessonById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*, topics(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

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
}
