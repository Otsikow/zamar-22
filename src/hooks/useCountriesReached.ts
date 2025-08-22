import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCountriesReached = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountriesCount = async () => {
      try {
        const { data, error } = await supabase
          .from('public_testimonies')
          .select('country')
          .not('country', 'is', null)
          .neq('country', '');

        if (error) {
          console.error('Error fetching countries:', error);
          return;
        }

        // Count unique countries
        const uniqueCountries = new Set(
          data?.map(item => item.country).filter(Boolean) || []
        );
        
        setCount(uniqueCountries.size);
      } catch (error) {
        console.error('Error fetching countries count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountriesCount();
  }, []);

  return { count, loading };
};