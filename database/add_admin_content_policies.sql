-- Admin Content Management RLS Policies
-- Run this in Supabase SQL Editor

-- LESSONS - Add delete policy
CREATE POLICY "Admins can delete lessons" ON public.lessons
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- TOPICS - Add update and delete policies
CREATE POLICY "Admins can update topics" ON public.topics
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete topics" ON public.topics
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- QUIZZES - Add all CRUD policies
CREATE POLICY "Admins can insert quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update quizzes" ON public.quizzes
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete quizzes" ON public.quizzes
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- QUIZ QUESTIONS - Add all CRUD policies
CREATE POLICY "Admins can insert questions" ON public.quiz_questions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update questions" ON public.quiz_questions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete questions" ON public.quiz_questions
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
