-- Create function to notify when custom song is delivered
CREATE OR REPLACE FUNCTION public.notify_custom_song_delivered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'custom_song_delivered',
      '🎁 Your custom song is ready!',
      'We''ve delivered your requested custom song: ' || NEW.song_title,
      '/library'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for custom song delivery notifications
CREATE TRIGGER trg_notify_song_delivery
AFTER UPDATE ON public.custom_songs
FOR EACH ROW
EXECUTE FUNCTION public.notify_custom_song_delivered();