-- Add show_creator field to playlists table to allow creators to choose anonymity
ALTER TABLE public.playlists 
ADD COLUMN show_creator boolean NOT NULL DEFAULT true;