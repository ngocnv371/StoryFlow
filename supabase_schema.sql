
-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Projects Table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'done', 'archived')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'summary'
  ) THEN
    EXECUTE $migration$
      UPDATE public.projects
      SET metadata = jsonb_strip_nulls(
        COALESCE(metadata, '{}'::jsonb)
        || jsonb_build_object(
          'summary', summary,
          'transcript', transcript,
          'word_count', word_count,
          'cover_prompt', cover_prompt,
          'narrator', narrator,
          'music', music,
          'thumbnail_url', thumbnail_url,
          'audio_url', audio_url,
          'duration', duration,
          'music_url', music_url,
          'video_url', video_url
        )
      )
    $migration$;
  END IF;
END
$$;

ALTER TABLE public.projects
  DROP COLUMN IF EXISTS summary,
  DROP COLUMN IF EXISTS transcript,
  DROP COLUMN IF EXISTS word_count,
  DROP COLUMN IF EXISTS cover_prompt,
  DROP COLUMN IF EXISTS narrator,
  DROP COLUMN IF EXISTS music,
  DROP COLUMN IF EXISTS thumbnail_url,
  DROP COLUMN IF EXISTS audio_url,
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS music_url,
  DROP COLUMN IF EXISTS video_url;

-- 3. Enable RLS on Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Policies for Projects
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
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
VALUES ('thumbnails', 'thumbnails', true), ('audio', 'audio', true), ('music', 'music', true), ('videos', 'videos', true)
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

-- Music Policies
CREATE POLICY "Public Read Access for Music"
ON storage.objects FOR SELECT
USING (bucket_id = 'music');

CREATE POLICY "Authenticated Upload Access for Music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update Access for Music"
ON storage.objects FOR UPDATE
USING (bucket_id = 'music' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Access for Music"
ON storage.objects FOR DELETE
USING (bucket_id = 'music' AND auth.role() = 'authenticated');

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

