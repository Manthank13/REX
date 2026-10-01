'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Network() {
  const [institutions, setInstitutions] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('institutions').select('id, name, city, state').then(({data}) => {
      if (data) setInstitutions(data);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">REX Network</h1>
      <p className="text-[var(--text-muted)] mb-12">Visualizing the connected student ecosystem.</p>

      <div className="relative h-[600px] bg-[var(--card)] border border-[var(--border-color)] rounded-xl overflow-hidden flex items-center justify-center">
        {/* Simple visual representation of network */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--accent)] via-transparent to-transparent"></div>
        
        <div className="z-10 flex flex-col gap-6 w-full max-w-2xl">
          {institutions.map((inst, idx) => (
            <div key={inst.id} className={`flex items-center gap-4 ${idx % 2 === 0 ? 'ml-0' : 'ml-12'}`}>
              <div className="w-4 h-4 rounded-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
              <div>
                <h3 className="font-medium text-white">{inst.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">{inst.city}, {inst.state}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
