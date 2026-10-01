'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session && pathname !== '/auth') {
        router.push('/auth');
      } else if (data.session) {
        const { data: p } = await supabase.from('profiles').select('name, institution:institutions(name)').eq('id', data.session.user.id).single();
        setProfile(p);
        setAuthChecking(false);
      } else {
        setAuthChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session && pathname !== '/auth') {
        router.push('/auth');
      } else if (session) {
        const { data: p } = await supabase.from('profiles').select('name, institution:institutions(name)').eq('id', session.user.id).single();
        setProfile(p);
        if (pathname === '/auth') router.push('/');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Ask REX', href: '/' },
    { name: 'Discover', href: '/discover' },
    { name: 'Exchanges', href: '/exchanges' },
    { name: 'Messages', href: '/messages' },
    { name: 'Network', href: '/network' },
  ];

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--panel)] flex flex-col justify-between">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">REX</h1>
            <p className="text-xs text-[var(--text-dim)] mt-1">India's Student Exchange Agent</p>
          </div>
          
          <nav className="mt-6 flex flex-col gap-1 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm transition-colors duration-200 ${isActive ? 'bg-[var(--accent-faint)] text-[var(--accent)] font-medium' : 'text-[var(--text-muted)] hover:text-white hover:bg-[#1a221d]'}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[var(--border-color)]">
          {profile ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent)] text-xs font-bold">
                  {profile.name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{profile.name}</span>
                  <span className="text-xs text-[var(--text-dim)] truncate w-40">
                    {Array.isArray(profile.institution) ? profile.institution[0]?.name : profile.institution?.name}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="text-xs text-left text-[var(--text-muted)] hover:text-white mt-2">Log out</button>
            </div>
          ) : (
            <div className="text-sm text-[var(--text-muted)]">Not logged in</div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="h-14 border-b border-[var(--border-color)] flex items-center px-8 bg-[var(--card)]/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex-1"></div>
          <div className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
            Connected to Network
          </div>
        </header>
        <div className="flex-1">
          {authChecking && pathname !== '/auth' ? <div className="p-8 text-[var(--text-muted)] animate-pulse">Authenticating to REX Network...</div> : children}
        </div>
      </main>
    </div>
  );
}
