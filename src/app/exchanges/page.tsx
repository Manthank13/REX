import { useUser } from '@/lib/useUser';
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Exchanges() {
  const userId = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);

  // DEMO USER
  

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/exchanges/requests`)
      .then(r => r.json())
      .then(d => setRequests(Array.isArray(d) ? d : []));
  }, [userId]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">My Exchanges</h1>
      
      {requests.length === 0 ? (
        <div className="text-[var(--text-muted)] p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-xl">
          No exchanges yet. <button onClick={() => router.push('/')} className="text-[var(--accent)] underline ml-2">Ask REX to find something</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map(req => {
            const inst = Array.isArray(req.resource?.institution) ? req.resource?.institution[0] : req.resource?.institution;
            return (
              <div 
                key={req.id} 
                onClick={() => router.push(`/exchanges/${req.id}`)}
                className="bg-[var(--card)] border border-[var(--border-color)] p-6 rounded-xl flex justify-between items-center cursor-pointer hover:border-[var(--accent)] transition-colors"
              >
                <div>
                  <h3 className="text-xl font-medium text-[var(--accent)]">{req.resource?.title}</h3>
                  <p className="text-[var(--text-muted)] text-sm mt-1">{inst?.name || 'Network'}</p>
                  <p className="text-white mt-2">₹{req.offer_price}</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-[#1a221d] rounded font-bold text-xs">
                    {req.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
