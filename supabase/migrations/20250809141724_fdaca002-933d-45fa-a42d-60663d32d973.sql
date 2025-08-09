-- Admins can delete notifications
DO $$ BEGIN
  -- Create policy only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Admins can delete notifications'
  ) THEN
    CREATE POLICY "Admins can delete notifications"
    ON public.notifications
    FOR DELETE
    USING (is_admin());
  END IF;
END $$;