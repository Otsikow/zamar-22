-- Check if trigger exists and create if not
DROP TRIGGER IF EXISTS notify_admin_new_message_trigger ON chat_messages;

-- Create trigger to call the function when new chat messages are inserted
CREATE TRIGGER notify_admin_new_message_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_message();