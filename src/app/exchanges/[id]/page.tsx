import { useUser } from '@/lib/useUser';
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { subscribeToExchangeMessages, subscribeToExchangeRequestStatus } from '@/lib/realtime';

export default function ExchangeNegotiation() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const userId = useUser();
  
  const [reqData, setReqData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [meetups, setMeetups] = useState<any[]>([]);
  const [selectedMeetup, setSelectedMeetup] = useState('');

  // HARDCODED DEMO USER
  

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    
    // Fetch initial data
    fetch(`/api/exchanges/requests/${id}`)
      .then(r => r.json())
      .then(d => {
        setReqData(d);
        setMessages(d.messages || []);
        setLoading(false);
        
        // Fetch meetups for the resource's institution
        if (d.resource?.institution_id) {
          fetch(`/api/meetups?institution_id=${d.resource.institution_id}`)
            .then(r => r.json())
            .then(md => setMeetups(md));
        }
      })
      .catch(e => setError(e.message));

    // Subscriptions
    const msgSub = subscribeToExchangeMessages(supabase, id, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    });

    const statusSub = subscribeToExchangeRequestStatus(supabase, id, (payload) => {
      setReqData((prev: any) => ({ ...prev, status: payload.new.status, offer_price: payload.new.offer_price }));
    });

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(statusSub);
    };
  }, [id, userId]);

  const handleSimulateOwnerCounter = async () => {
    // This is purely for the demo flow, we simulate the owner replying.
    await fetch('/api/exchanges/counter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange_request_id: id,
        counter_price: 700,
        message: 'I can do ₹700.'
      })
    });
  };

  const handleAccept = async () => {
    await fetch('/api/exchanges/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange_request_id: id,

        message: 'Okay, ₹700 works for me.'
      })
    });
  };

  const handleConfirm = async () => {
    if (!selectedMeetup) return;
    await fetch('/api/exchanges/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange_request_id: id,

        meetup_location_id: selectedMeetup
      })
    });
    router.push(`/exchanges/${id}/success`);
  };

  if (loading) return <div className="p-8">Loading negotiation...</div>;
  if (!reqData) return <div className="p-8 text-red-400">Not found</div>;

  const isRequester = userId === reqData.requester_id;
  const currentStatus = reqData.status;
  const isAccepted = currentStatus === 'ACCEPTED' || currentStatus === 'CONFIRMED' || currentStatus === 'COMPLETED';

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 flex flex-col gap-8">
      <div className="flex justify-between items-end border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-bold">{reqData.resource.title}</h1>
          <p className="text-[var(--text-muted)] mt-1">{Array.isArray(reqData.resource.institution) ? reqData.resource.institution[0]?.name : reqData.resource.institution?.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--text-dim)] uppercase">Current Offer</div>
          <div className="text-2xl font-medium text-[var(--accent)]">₹{reqData.offer_price}</div>
          <div className="inline-block mt-2 px-2 py-1 text-xs font-bold rounded bg-[#1a221d] text-white">
            {currentStatus}
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-xl h-[400px] overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map(m => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex flex-col max-w-[80%] ${mine ? 'self-start' : 'self-end'}`}>
                  <span className="text-xs text-[var(--text-dim)] mb-1 {mine ? '' : 'text-right'}">{mine ? 'You' : 'Owner'}</span>
                  <div className={`p-3 rounded-xl ${mine ? 'bg-[#1a221d] border border-[var(--border-color)]' : 'bg-[var(--accent-faint)] border border-[var(--accent-dim)] text-white'}`}>
                    {m.message}
                  </div>
                </div>
              );
            })}
          </div>

          {!isAccepted && (
            <div className="flex gap-2">
              <button 
                onClick={handleSimulateOwnerCounter}
                className="text-xs bg-[#1a221d] text-[var(--text-muted)] hover:text-white px-3 py-1 rounded border border-[var(--border-color)]"
              >
                [Demo] Simulate Owner Counter
              </button>
            </div>
          )}
        </div>

        <div className="w-80 flex flex-col gap-6">
          {currentStatus === 'COUNTERED' && (
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xl">
              <h3 className="font-medium mb-4">Owner countered with ₹{reqData.offer_price}</h3>
              <button 
                onClick={handleAccept}
                className="w-full bg-[var(--accent)] text-black font-medium py-3 rounded-md hover:bg-[#2bc475] transition-colors"
              >
                Accept ₹{reqData.offer_price}
              </button>
            </div>
          )}

          {isAccepted && (
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xl border-t-4 border-t-[var(--accent)]">
              <h3 className="font-medium text-lg mb-2">Exchange ready</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">Select a public location to confirm the exchange.</p>
              
              <div className="flex flex-col gap-3 mb-6">
                {meetups.map(m => (
                  <label key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedMeetup === m.id ? 'border-[var(--accent)] bg-[var(--accent-faint)]' : 'border-[var(--border-color)] bg-[#1a221d]'}`}>
                    <input 
                      type="radio" 
                      name="meetup" 
                      value={m.id} 
                      onChange={() => setSelectedMeetup(m.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm text-white">{m.name}</div>
                      <div className="text-xs text-[var(--text-dim)]">{m.address}</div>
                    </div>
                  </label>
                ))}
              </div>

              {currentStatus !== 'CONFIRMED' && currentStatus !== 'COMPLETED' ? (
                <button 
                  onClick={handleConfirm}
                  disabled={!selectedMeetup}
                  className="w-full bg-[var(--accent)] text-black font-medium py-3 rounded-md hover:bg-[#2bc475] transition-colors disabled:opacity-50"
                >
                  Confirm exchange
                </button>
              ) : (
                <button disabled className="w-full bg-[#1a221d] text-[var(--accent)] font-medium py-3 rounded-md border border-[var(--accent-dim)]">
                  Exchange Confirmed
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
