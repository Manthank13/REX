'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('institutions').select('id, name').then(({ data }) => {
      if (data) setInstitutions(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      } else {
        if (!institutionId) throw new Error('Please select a college');
        
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name }
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Update profile institution since trigger sets it to null
          const { error: updateErr } = await supabase.from('profiles').update({ institution_id: institutionId }).eq('id', data.user.id);
          if (updateErr) throw updateErr;
        }

        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
      <div className="w-full max-w-md bg-[var(--card)] p-8 rounded-xl border border-[var(--border-color)]">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">{isLogin ? 'Log in to REX' : 'Join REX'}</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Full Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1a221d] border border-[var(--border-color)] rounded-md px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">College</label>
                <select required value={institutionId} onChange={e => setInstitutionId(e.target.value)} className="w-full bg-[#1a221d] border border-[var(--border-color)] rounded-md px-3 py-2 text-white">
                  <option value="">Select your institution...</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1a221d] border border-[var(--border-color)] rounded-md px-3 py-2 text-white" />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1a221d] border border-[var(--border-color)] rounded-md px-3 py-2 text-white" />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button disabled={loading} type="submit" className="w-full bg-[var(--accent)] text-black font-medium py-2 rounded-md hover:bg-[#2fc477] transition-colors mt-2">
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[var(--accent)] hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] mb-3 text-center uppercase tracking-wider">Fast Demo Access</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => handleDemoLogin('aarav@demo.rex')} className="px-3 py-1 bg-[#1a221d] border border-[var(--border-color)] rounded text-sm hover:border-[var(--accent)] transition-colors">Aarav (SRM)</button>
            <button onClick={() => handleDemoLogin('vikram@demo.rex')} className="px-3 py-1 bg-[#1a221d] border border-[var(--border-color)] rounded text-sm hover:border-[var(--accent)] transition-colors">Vikram (IITM)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
