-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  admin_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES public.chat_rooms(id) NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) NOT NULL,
  message text NOT NULL,
  seen boolean DEFAULT false,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (is_admin());

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (is_admin());

-- RLS policies for chat_rooms
CREATE POLICY "Users can view their own chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own chat rooms" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update chat rooms" 
ON public.chat_rooms 
FOR UPDATE 
USING (is_admin());

-- RLS policies for chat_messages
CREATE POLICY "Users can view messages in their rooms" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id 
    AND (user_id = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Users can send messages in their rooms" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id 
    AND (user_id = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Admins can update message seen status" 
ON public.chat_messages 
FOR UPDATE 
USING (is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification when new custom song request is created
CREATE OR REPLACE FUNCTION public.notify_admin_new_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (type, message, user_id)
  VALUES (
    'song_request',
    'New custom song request: ' || NEW.key_message,
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when new chat message is sent
CREATE OR REPLACE FUNCTION public.notify_admin_new_message()
RETURNS TRIGGER AS $$
DECLARE
  room_user_id uuid;
BEGIN
  -- Get the user_id from the chat room
  SELECT user_id INTO room_user_id 
  FROM public.chat_rooms 
  WHERE id = NEW.room_id;
  
  -- Only notify if message is from user (not admin)
  IF NEW.sender_id = room_user_id THEN
    INSERT INTO public.notifications (type, message, user_id)
    VALUES (
      'message',
      'New chat message from user',
      NEW.sender_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_custom_song_request_created
  AFTER INSERT ON public.custom_song_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_request();

CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_message();