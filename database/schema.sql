-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  username text,
  avatar_url text,
  role text check (role in ('student', 'admin')) default 'student',
  section text default 'Unassigned',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies for users
create policy "Public profiles are viewable by everyone." on public.users
  for select using (true);

create policy "Users can insert their own profile." on public.users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.users
  for update using (auth.uid() = id);

-- LESSONS TABLE
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  category text check (category in ('ICT', 'Agriculture', 'Industrial Arts', 'Tourism')) not null,
  description text,
  "order" integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lessons enable row level security;
create policy "Lessons are viewable by everyone." on public.lessons for select using (true);
create policy "Admins can insert lessons." on public.lessons for insert with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admins can update lessons." on public.lessons for update using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- TOPICS TABLE
create table public.topics (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  title text not null,
  content text, -- Can be markdown or JSON for rich content
  "order" integer not null,
  estimated_time integer, -- in minutes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.topics enable row level security;
create policy "Topics are viewable by everyone." on public.topics for select using (true);
create policy "Admins can insert topics." on public.topics for insert with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- USER TOPIC PROGRESS
create table public.user_topic_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete cascade not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  time_spent integer default 0, -- in seconds
  unique(user_id, topic_id)
);

alter table public.user_topic_progress enable row level security;
create policy "Users can view own progress." on public.user_topic_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress." on public.user_topic_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress." on public.user_topic_progress for update using (auth.uid() = user_id);

-- QUIZZES TABLE
create table public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete cascade,
  title text not null,
  passing_score integer default 70,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint quiz_belongs_to_lesson_or_topic check (
    (lesson_id is not null and topic_id is null) or (lesson_id is null and topic_id is not null)
  )
);

alter table public.quizzes enable row level security;
create policy "Quizzes are viewable by everyone." on public.quizzes for select using (true);

-- QUIZ QUESTIONS
create table public.quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- Array of options e.g. ["A", "B", "C", "D"]
  correct_answer text not null,
  "order" integer not null
);

alter table public.quiz_questions enable row level security;
create policy "Quiz questions are viewable by everyone." on public.quiz_questions for select using (true);

-- QUIZ ATTEMPTS
create table public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  score integer not null,
  answers jsonb, -- Store user answers
  attempt_number integer default 1,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_attempts enable row level security;
create policy "Users can view own attempts." on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "Users can insert own attempts." on public.quiz_attempts for insert with check (auth.uid() = user_id);

-- LEADERBOARD
-- Note: This could be a view or a table updated via triggers. For simplicity, we'll make it a table updated by application logic or triggers.
create table public.leaderboard (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade, -- Nullable for overall leaderboard
  points integer default 0,
  rank integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

alter table public.leaderboard enable row level security;
create policy "Leaderboard is viewable by everyone." on public.leaderboard for select using (true);

-- Trigger to handle new user signup (optional but good for syncing auth.users to public.users)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- GAMIFICATION UPDATES

-- Add streak tracking to users
alter table public.users add column streak_days integer default 0;
alter table public.users add column last_login_date timestamp with time zone;

-- ACHIEVEMENTS TABLE
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  icon text not null, -- URL or icon name
  condition_type text not null, -- e.g., 'quiz_count', 'login_streak', 'perfect_score'
  condition_value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.achievements enable row level security;
create policy "Achievements are viewable by everyone." on public.achievements for select using (true);

-- USER ACHIEVEMENTS
create table public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "Users can view own achievements." on public.user_achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements." on public.user_achievements for insert with check (auth.uid() = user_id);

-- XP AND LEVEL SYSTEM
-- Add xp and level columns to users
alter table public.users add column if not exists xp integer default 0;
alter table public.users add column if not exists level integer default 1;

-- Policy for users to update their own XP
create policy "Users can update own xp." on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

-- PUSH NOTIFICATIONS AND ANNOUNCEMENTS

-- Add push token to users table
alter table public.users add column if not exists push_token text;

-- ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  teacher_name text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.announcements enable row level security;

-- Everyone can view announcements
create policy "Announcements are viewable by everyone." on public.announcements for select using (true);

-- Only admins can create announcements
create policy "Admins can create announcements." on public.announcements for insert 
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Only admins can delete announcements
create policy "Admins can delete announcements." on public.announcements for delete 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
