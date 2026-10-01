import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowRightLeft, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { Profile, ExchangeRequest, Resource, Institution } from '../types';
import { db } from '../services/db';
import { RexMap } from '../components/RexMap';

interface ExchangeRequestsPageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  onExchangeConfirmed: (req: ExchangeRequest) => void;
}

export const ExchangeRequestsPage: React.FC<ExchangeRequestsPageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  onExchangeConfirmed,
}) => {
  const [requests, setRequests] = useState<{
    incoming: ExchangeRequest[];
    outgoing: ExchangeRequest[];
  }>({ incoming: [], outgoing: [] });

  const [counterPriceInput, setCounterPriceInput] = useState<{ [id: string]: number }>({});
  const [showCounterBox, setShowCounterBox] = useState<{ [id: string]: boolean }>({});

  const refreshRequests = () => {
    setRequests(db.getRequestsForUser(currentUser.id));
  };

  useEffect(() => {
    refreshRequests();
    const unsub = db.subscribeRealtime(() => {
      refreshRequests();
    });
    return unsub;
  }, [currentUser]);

  const handleAccept = (reqId: string) => {
    db.acceptOffer(reqId);
    refreshRequests();
  };

  const handleCounter = (reqId: string) => {
    const price = counterPriceInput[reqId] || 700;
    db.counterOffer(reqId, price);
    setShowCounterBox(prev => ({ ...prev, [reqId]: false }));
    refreshRequests();
  };

  const handleAcceptCounter = (reqId: string) => {
    const updated = db.acceptCounterOffer(reqId);
    refreshRequests();
    onExchangeConfirmed(updated);
  };

  const handleDecline = (reqId: string) => {
    db.declineOffer(reqId);
    refreshRequests();
  };

  const handleConfirmMeetup = (reqId: string) => {
    const updated = db.confirmMeetup(reqId, currentUser.id);
    refreshRequests();
    if (updated.status === 'MEETUP_CONFIRMED') {
      onExchangeConfirmed(updated);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Realtime Negotiation & Handshake</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Exchange Requests & Negotiations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Peer-to-peer offers negotiated by REX. Realtime updates across active browsers and institutions.
        </p>
      </div>

      {/* Tabs / Two Columns: Incoming vs Outgoing */}
      <div className="space-y-8">
        
        {/* INCOMING REQUESTS (Where current user is the owner) */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <Inbox className="w-4 h-4 text-emerald-400" />
              <span>Incoming Requests For Your Resources ({requests.incoming.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Acting as Resource Owner
            </span>
          </div>

          {requests.incoming.length === 0 ? (
            <div className="p-6 rounded-2xl glass-panel text-center border-dashed border-white/10 text-xs text-slate-400">
              No incoming exchange requests right now. When a peer student asks REX for your listed item, the offer will appear here in realtime.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.incoming.map((req) => {
                const resource = db.getResourceById(req.resource_id);
                const requester = db.getAllProfiles().find(p => p.id === req.requester_id);
                const requesterInst = requester ? db.getInstitutionById(requester.institution_id) : undefined;

                return (
                  <div 
                    key={req.id}
                    className={`glass-panel rounded-2xl p-5 sm:p-6 border transition-all ${
                      req.status === 'PENDING'
                        ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                        : req.status === 'ACCEPTED' || req.status === 'MEETUP_CONFIRMED'
                        ? 'border-emerald-500/60 bg-emerald-500/[0.02]'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Prompt specified format:
                        REX EXCHANGE REQUEST
                        Raspberry Pi 4
                        Offer: ₹650
                        Requested duration: 3 days
                        Student: Verified
                        [ ACCEPT ] [ COUNTER ] [ DECLINE ]
                    */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-bold block w-fit mb-1">
                          REX EXCHANGE REQUEST
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {resource?.title || 'Campus Resource'}
                        </h3>
                        <span className="text-xs text-slate-400">
                          From <strong className="text-white">{requester?.name}</strong> ({requesterInst?.name})
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-400 block uppercase">Offer Price</span>
                        <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                          ₹{req.offered_price}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5">
                      <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Requested Duration</span>
                        <span className="font-bold text-slate-200">{req.requested_duration}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Student Status</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified Institutional ID
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Listing Price</span>
                        <span className="font-mono text-slate-300">₹{resource?.price}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Exchange Status</span>
                        <span className="font-bold font-mono text-white">{req.status}</span>
                      </div>
                    </div>

                    {/* Pending Actions: ACCEPT / COUNTER / DECLINE */}
                    {req.status === 'PENDING' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleAccept(req.id)}
                            className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            [ ACCEPT ]
                          </button>

                          <button
                            onClick={() => setShowCounterBox(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                            className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-charcoal-900 hover:bg-white/10 border border-white/15 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            [ COUNTER ]
                          </button>

                          <button
                            onClick={() => handleDecline(req.id)}
                            className="py-2.5 px-4 rounded-xl bg-charcoal-900 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            [ DECLINE ]
                          </button>
                        </div>

                        {/* Counter Price Box */}
                        {showCounterBox[req.id] && (
                          <div className="p-3.5 rounded-xl bg-charcoal-950 border border-white/10 flex items-center gap-3 animate-slide-up">
                            <span className="text-xs font-mono text-slate-400">Propose Counter Price:</span>
                            <div className="relative w-32">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                              <input
                                type="number"
                                defaultValue={req.offered_price + 50}
                                onChange={(e) => setCounterPriceInput(prev => ({ ...prev, [req.id]: Number(e.target.value) }))}
                                className="w-full bg-charcoal-900 border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white font-mono font-bold"
                              />
                            </div>
                            <button
                              onClick={() => handleCounter(req.id)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-charcoal-950 font-bold text-xs"
                            >
                              Send Counter Offer
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Accepted: Meetup Coordination */}
                    {(req.status === 'ACCEPTED' || req.status === 'MEETUP_CONFIRMED') && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono uppercase">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>OFFER ACCEPTED ✓ — Safe Meetup Assigned</span>
                          </span>
                          <span className="font-mono text-white font-bold">
                            {req.status === 'MEETUP_CONFIRMED' ? '✓ Both Parties Confirmed' : 'Confirmation Pending'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-lg bg-charcoal-900/90 border border-white/5">
                            <span className="text-[10px] text-slate-500 font-mono uppercase block">Approved Campus Spot</span>
                            <span className="font-bold text-white">{req.meetup_location_name}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-charcoal-900/90 border border-white/5">
                            <span className="text-[10px] text-slate-500 font-mono uppercase block">Handover Slot</span>
                            <span className="font-bold text-white">{req.meetup_time}</span>
                          </div>
                        </div>

                        {!req.owner_confirmed && (
                          <button
                            onClick={() => handleConfirmMeetup(req.id)}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 text-charcoal-950 font-bold text-xs tracking-wide shadow-md"
                          >
                            Confirm Handover as Owner
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* OUTGOING REQUESTS (Where current user is the requester) */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Your Outgoing Exchange Requests ({requests.outgoing.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Acting as Requester
            </span>
          </div>

          {requests.outgoing.length === 0 ? (
            <div className="p-6 rounded-2xl glass-panel text-center border-dashed border-white/10 text-xs text-slate-400">
              You haven't requested any resources yet. Use "Ask REX" or browse "Discover" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.outgoing.map((req) => {
                const resource = db.getResourceById(req.resource_id);
                const owner = db.getAllProfiles().find(p => p.id === req.owner_id);
                const ownerInst = owner ? db.getInstitutionById(owner.institution_id) : undefined;

                return (
                  <div 
                    key={req.id}
                    className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Requested Resource</span>
                        <h4 className="text-base font-bold text-white">{resource?.title}</h4>
                        <span className="text-xs text-slate-400">
                          Owner: <strong className="text-white">{owner?.name}</strong> at {ownerInst?.name}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-400 block uppercase">Your Offer</span>
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          ₹{req.offered_price}
                        </span>
                      </div>
                    </div>

                    {/* Realtime Status Indicator */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {req.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                            Waiting for {owner?.name}'s response in realtime...
                          </span>
                        )}

                        {req.status === 'ACCEPTED' && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5 animate-pulse">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>OFFER ACCEPTED ✓</span>
                          </span>
                        )}

                        {req.status === 'COUNTERED' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                              Owner countered with ₹{req.counter_price}
                            </span>
                            <button
                              onClick={() => handleAcceptCounter(req.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold font-mono text-xs transition-colors"
                            >
                              [ ACCEPT COUNTER OFFER (₹{req.counter_price}) ]
                            </button>
                            <button
                              onClick={() => handleDecline(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-red-500/30 text-red-400 font-mono text-xs hover:bg-red-500/20 transition-colors"
                            >
                              [ DECLINE ]
                            </button>
                          </div>
                        )}

                        {req.status === 'MEETUP_CONFIRMED' && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-charcoal-950 font-mono font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>EXCHANGE CONFIRMED</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        ID: {req.id}
                      </span>
                    </div>

                    {/* Meetup Handover info if accepted */}
                    {(req.status === 'ACCEPTED' || req.status === 'MEETUP_CONFIRMED') && (
                      <div className="p-3.5 rounded-xl bg-charcoal-900 border border-emerald-500/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-white">
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Meetup: {req.meetup_location_name}</span>
                          </span>
                          <span className="font-mono text-slate-300">{req.meetup_time}</span>
                        </div>

                        {!req.requester_confirmed && (
                          <button
                            onClick={() => handleConfirmMeetup(req.id)}
                            className="w-full mt-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs"
                          >
                            Confirm Handover as Requester
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
