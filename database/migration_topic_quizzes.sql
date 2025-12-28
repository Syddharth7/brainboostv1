-- Migration: Update quiz schema to support topic-based quizzes
-- Run this in Supabase SQL Editor

-- Step 1: Add topic_id column to quizzes table
ALTER TABLE public.quizzes ADD COLUMN topic_id uuid REFERENCES public.topics(id) ON DELETE CASCADE;

-- Step 2: Make lesson_id nullable
ALTER TABLE public.quizzes ALTER COLUMN lesson_id DROP NOT NULL;

-- Step 3: Add constraint to ensure quiz belongs to either lesson or topic
ALTER TABLE public.quizzes ADD CONSTRAINT quiz_belongs_to_lesson_or_topic 
  CHECK (
    (lesson_id IS NOT NULL AND topic_id IS NULL) OR 
    (lesson_id IS NULL AND topic_id IS NOT NULL)
  );

-- Step 4: Delete existing ICT quizzes (we'll recreate them properly)
DELETE FROM public.quizzes WHERE lesson_id = '2168e84c-dc22-44d5-b0d3-d31727155fdf';

-- Step 5: Get topic IDs (run this first to get the actual UUIDs, then use them below)
-- SELECT id, title FROM public.topics WHERE lesson_id = '2168e84c-dc22-44d5-b0d3-d31727155fdf' ORDER BY "order";
