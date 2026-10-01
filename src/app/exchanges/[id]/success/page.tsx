import { useUser } from '@/lib/useUser';
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function Success() {
  const params = useParams();
  const id = params.id as string;
  const userId = useUser();
  const router = useRouter();
  
  const [exchange, setExchange] = useState<any>(null);

  

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/exchanges/${id}`)
      .then(r => r.json())
      .then(d => setExchange(d))
      .catch(console.error);
  }, [id, userId]);

  if (!exchange) return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse">Confirming via network...</div>;

  return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center flex flex-col items-center">
      <div className="w-16 h-16 bg-[var(--accent-faint)] border border-[var(--accent-dim)] rounded-full flex items-center justify-center text-[var(--accent)] text-2xl font-bold mb-6">
        ✓
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Exchange confirmed</h1>
      <p className="text-[var(--text-muted)] mb-12">Both students can now coordinate the exchange.</p>

      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-xl w-full p-8 shadow-xl text-left">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-medium text-[var(--accent)]">{exchange.resource?.title}</h3>
            <p className="text-sm text-[var(--text-muted)]">{Array.isArray(exchange.resource?.institution) ? exchange.resource?.institution[0]?.name : exchange.resource?.institution?.name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-[var(--text-dim)] uppercase">Final Price</div>
            <div className="text-xl font-medium">₹{exchange.final_price}</div>
          </div>
        </div>

        <div className="bg-[#1a221d] rounded-lg p-4 border border-[var(--border-color)] mb-6">
          <div className="text-xs text-[var(--text-dim)] uppercase mb-1">Meetup Location</div>
          <div className="font-medium text-white">{exchange.meetup_location?.name}</div>
          <div className="text-sm text-[var(--text-muted)] mt-1">{exchange.meetup_location?.address}</div>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-white text-black rounded-md font-medium hover:bg-gray-200"
          >
            Find another resource
          </button>
        </div>
      </div>
    </div>
  );
}
