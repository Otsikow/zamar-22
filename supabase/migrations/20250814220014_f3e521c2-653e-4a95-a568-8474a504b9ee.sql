-- Enable realtime for testimonies table
ALTER TABLE public.testimonies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonies;