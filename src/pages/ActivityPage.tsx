import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Building2,
  AlertCircle
} from 'lucide-react';
import { Profile, Institution, ExchangeRequest, Resource } from '../types';
import { db } from '../services/db';

interface ActivityPageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  onNavigateToRequests: () => void;
  onNavigateToAskRex: () => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  onNavigateToRequests,
  onNavigateToAskRex,
}) => {
  const [requests, setRequests] = useState<{
    incoming: ExchangeRequest[];
    outgoing: ExchangeRequest[];
  }>({ incoming: [], outgoing: [] });

  const refresh = () => {
    setRequests(db.getRequestsForUser(currentUser.id));
  };

  useEffect(() => {
    refresh();
    const unsub = db.subscribeRealtime(() => refresh());
    return unsub;
  }, [currentUser]);

  const allUserExchanges = [...requests.outgoing, ...requests.incoming];

  const getStatusBadge = (status: ExchangeRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-bold">STAGE: REQUESTED</span>;
      case 'COUNTERED':
        return <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] font-bold">STAGE: NEGOTIATING</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">STAGE: ACCEPTED</span>;
      case 'MEETUP_CONFIRMED':
        return <span className="px-2.5 py-1 rounded bg-emerald-500 text-charcoal-950 font-mono text-[10px] font-extrabold">STAGE: MEETUP_CONFIRMED ✓</span>;
      case 'DECLINED':
        return <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[10px] font-bold">STAGE: DECLINED</span>;
      default:
        return <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">STAGE: {status}</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Real Exchange Lifecycle</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Exchange Lifecycle & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Realtime tracking of requests, negotiations, and campus meetups. No simulated metrics.
          </p>
        </div>

        <button
          onClick={onNavigateToAskRex}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Ask REX For Item</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lifecycle Flow Diagram */}
      <div className="glass-panel rounded-2xl p-5 border-white/10">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-3">
          Exchange Protocol Stages
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[11px] font-mono">
          <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5 text-slate-300">
            1. SEARCHING
          </div>
          <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5 text-slate-300">
            2. REQUESTED
          </div>
          <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5 text-slate-300">
            3. NEGOTIATING
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
            4. ACCEPTED
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold">
            5. MEETUP_CONFIRMED
          </div>
          <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5 text-slate-400">
            6. COMPLETED
          </div>
        </div>
      </div>

      {/* Real Active Exchanges */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Active Exchange Records ({allUserExchanges.length})
        </h2>

        {allUserExchanges.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel text-center border-dashed border-white/10 text-xs text-slate-400">
            No active exchange records in the database. Give REX a goal or list a resource to begin.
          </div>
        ) : (
          allUserExchanges.map((req) => {
            const resource = db.getResourceById(req.resource_id);
            const isRequester = req.requester_id === currentUser.id;
            const otherUser = db.getAllProfiles().find(p => p.id === (isRequester ? req.owner_id : req.requester_id));
            const otherInst = otherUser ? db.getInstitutionById(otherUser.institution_id) : undefined;

            return (
              <div 
                key={req.id}
                className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(req.status)}
                      <span className="text-[10px] font-mono text-slate-500">
                        Record ID: {req.id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">
                      {resource?.title || 'Resource'}
                    </h3>

                    <div className="text-xs text-slate-400 mt-0.5">
                      {isRequester ? 'Owner: ' : 'Requester: '}
                      <strong className="text-white">{otherUser?.name}</strong> ({otherInst?.name})
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Agreed Terms</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      ₹{req.counter_price || req.offered_price}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {req.requested_duration}
                    </span>
                  </div>
                </div>

                {/* Handover Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Meetup Handover Spot</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {req.meetup_location_name || 'Assigned on acceptance'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Handover Window</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {req.meetup_time || 'Pending confirmation'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    Updated: {new Date(req.updated_at).toLocaleTimeString()}
                  </span>

                  <button
                    onClick={onNavigateToRequests}
                    className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Manage in Requests</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
