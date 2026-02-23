
-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Stories Table
CREATE TABLE public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  transcript TEXT DEFAULT '',
  cover_prompt TEXT,
  narrator TEXT,
  music TEXT,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Completed')),
  thumbnail_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Policies for Stories
CREATE POLICY "Users can view their own stories" ON public.stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Trigger for Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Storage Setup (Buckets and RLS)

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true), ('audio', 'audio', true), ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects (usually enabled by default in Supabase)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Thumbnails Policies
CREATE POLICY "Public Read Access for Thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated Upload Access for Thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update Access for Thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Access for Thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

-- Audio Policies
CREATE POLICY "Public Read Access for Audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Authenticated Upload Access for Audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update Access for Audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Access for Audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio' AND auth.role() = 'authenticated');

-- Video Policies
CREATE POLICY "Public Read Access for Video"
ON storage.objects FOR SELECT
USING (bucket_id = 'video');

CREATE POLICY "Authenticated Upload Access for Video"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update Access for Video"
ON storage.objects FOR UPDATE
USING (bucket_id = 'video' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Access for Video"
ON storage.objects FOR DELETE
USING (bucket_id = 'video' AND auth.role() = 'authenticated');

