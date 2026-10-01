import { useUser } from '@/lib/useUser';
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function ResourceDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const userId = useUser();
  
  const [resource, setResource] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [message, setMessage] = useState('I can pick it up this weekend.');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // HARDCODED test user for the demo since we lack real auth context in UI without hitting Supabase auth
  

  useEffect(() => {
    fetch(`/api/resources/${id}`)
      .then(r => r.json())
      .then(d => {
        setResource(d);
        setOfferPrice(d.price ? d.price.toString() : '');
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const handleOffer = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/exchanges/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: id,
          
          offer_price: Number(offerPrice),
          message
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to make offer');
      
      router.push(`/exchanges/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-[var(--text-muted)]">Loading resource...</div>;
  if (!resource) return <div className="p-8 text-red-400">Resource not found {error}</div>;

  const inst = Array.isArray(resource.institution) ? resource.institution[0] : resource.institution;

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-[var(--accent)] mb-2">{resource.title}</h1>
        <p className="text-lg text-[var(--foreground)]">{inst?.name}</p>
        
        <div className="flex gap-4 mt-6 border-y border-[var(--border-color)] py-6">
          <div>
            <div className="text-xs text-[var(--text-dim)] uppercase">Listed Price</div>
            <div className="text-xl font-medium">₹{resource.price}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-dim)] uppercase">Condition</div>
            <div className="text-xl font-medium">{resource.condition}</div>
          </div>
          {resource.distance_km && (
            <div>
              <div className="text-xs text-[var(--text-dim)] uppercase">Distance</div>
              <div className="text-xl font-medium text-[var(--accent)]">{resource.distance_km.toFixed(1)} km from you</div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Make an offer</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">Your Price (₹)</label>
              <input 
                type="number"
                className="w-full bg-[#1a221d] border border-[var(--border-color)] rounded-md px-4 py-2 outline-none focus:border-[var(--accent)]"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">Message to Owner</label>
              <textarea 
                className="w-full bg-[#1a221d] border border-[var(--border-color)] rounded-md px-4 py-2 outline-none focus:border-[var(--accent)] h-24 resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
              ></textarea>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button 
              onClick={handleOffer}
              disabled={submitting}
              className="bg-white text-black font-medium py-3 rounded-md hover:bg-gray-200 mt-2 disabled:opacity-50"
            >
              {submitting ? 'Sending offer...' : 'Send offer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
