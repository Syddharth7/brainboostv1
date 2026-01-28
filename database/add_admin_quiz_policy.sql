-- Add policy for admins to view all quiz attempts
-- Run this in your Supabase SQL Editor

-- Allow admins to view ALL quiz attempts (for student management)
CREATE POLICY "Admins can view all quiz attempts." 
ON public.quiz_attempts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- If the above fails due to policy name conflict, try:
-- DROP POLICY IF EXISTS "Admins can view all quiz attempts." ON public.quiz_attempts;
-- Then run the CREATE POLICY again
