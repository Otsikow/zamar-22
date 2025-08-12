import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Primary check: simple boolean function using auth.uid()
        const { data: isAdminFlag, error: isAdminErr } = await supabase.rpc('is_admin');
        if (isAdminErr) {
          console.error('Error checking admin status (is_admin):', isAdminErr);
        }

        if (isAdminFlag === true) {
          setIsAdmin(true);
          return;
        }

        // Fallback: role-based function that accepts explicit user_id
        if (user?.id) {
          const { data: role, error: roleErr } = await supabase.rpc('get_user_role', { user_id: user.id });
          if (roleErr) {
            console.error('Error checking admin status (get_user_role):', roleErr);
          }
          setIsAdmin(role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Unexpected error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  return { isAdmin, loading };
};