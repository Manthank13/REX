import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  return userId;
}
