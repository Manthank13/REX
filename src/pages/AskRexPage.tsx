import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Check, 
  Loader2, 
  Radio,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { 
  Profile, 
  Institution, 
  SearchCandidate, 
  AgentIntent, 
  DecisionTraceEvent,
  Resource 
} from '../types';
import { extractIntent, executeAgentSearch } from '../services/agentEngine';
import { RexMap } from '../components/RexMap';
import { db } from '../services/db';

interface AskRexPageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  initialGoal?: string;
  onRequestExchange: (candidate: SearchCandidate, offeredPrice: number) => void;
}

export const AskRexPage: React.FC<AskRexPageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  initialGoal,
  onRequestExchange,
}) => {
  const [goalText, setGoalText] = useState(initialGoal || 'I need a Raspberry Pi for this weekend. Preferably from my college.');
  const [isRunning, setIsRunning] = useState(false);
  const [agentStep, setAgentStep] = useState<number>(0);
  const [extractedIntent, setExtractedIntent] = useState<AgentIntent | null>(null);
  const [decisionTrace, setDecisionTrace] = useState<DecisionTraceEvent[]>([]);
  const [bestMatch, setBestMatch] = useState<SearchCandidate | null>(null);
  const [alternatives, setAlternatives] = useState<SearchCandidate[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [finalStage, setFinalStage] = useState<string>('');
  const [showTrace, setShowTrace] = useState<boolean>(true);
  const [showFullMap, setShowFullMap] = useState<boolean>(false);
  const [customOfferPrice, setCustomOfferPrice] = useState<number>(650);

  // Run agent execution
  const runAgent = async (queryToRun: string) => {
    setIsRunning(true);
    setAgentStep(0);
    setDecisionTrace([]);
    setBestMatch(null);
    setAlternatives([]);

    // Step 0: Extract intent
    const intent = await extractIntent(queryToRun, (evt) => {
      setDecisionTrace(prev => [...prev, evt]);
    });
    setExtractedIntent(intent);
    setAgentStep(1);

    // Step 1 - 3: Execute search pipeline with real stage expansion
    const { bestMatch: match, allCandidates, finalStage: stage, explanation: exp } = 
      await executeAgentSearch(intent, currentUser, (evt) => {
        setDecisionTrace(prev => [...prev, evt]);
      });

    setFinalStage(stage);
    setBestMatch(match);
    if (match) {
      setCustomOfferPrice(match.resource.price);
      setAlternatives(allCandidates.filter(c => c.resource.id !== match.resource.id));
    }
    setExplanation(exp);
    setAgentStep(4);
    setIsRunning(false);
  };

  useEffect(() => {
    if (initialGoal) {
      runAgent(initialGoal);
    }
  }, [initialGoal]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalText.trim()) {
      runAgent(goalText.trim());
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in space-y-8">
      
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold mb-3">
          <Bot className="w-3.5 h-3.5" />
          <span>REX AUTONOMOUS AGENT ORCHESTRATOR</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          What is your campus goal?
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          REX will autonomously search your college, evaluate constraints, expand across nearby institutions if needed, and negotiate with the verified owner.
        </p>
      </div>

      {/* Goal Input Bar */}
      <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto relative group">
        <div className="relative glass-panel rounded-2xl p-2.5 border-white/10 group-focus-within:border-emerald-500/50 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-3 flex-1 px-3 py-2">
            <Search className="w-5 h-5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="e.g. I need a Raspberry Pi for this weekend. Preferably from my college..."
              className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isRunning}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-charcoal-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ORCHESTRATING...</span>
              </>
            ) : (
              <>
                <span>ASK REX</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Agent Activity Timeline (When Running or Completed) */}
      {(isRunning || bestMatch) && (
        <div className="glass-panel rounded-2xl p-6 border-white/10 shadow-2xl animate-fade-in">
          
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                REX Autonomous Execution Pipeline
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400">
                {isRunning ? 'Processing Stage Expansion...' : 'Optimal Match Located'}
              </span>
            </div>
          </div>

          {/* Animated Timeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Real-time Multi-Stage Progression */}
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-charcoal-900 border border-white/5 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Understanding request & extracting constraints</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-charcoal-900 border border-white/5 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Searching your college: <strong className="text-white">{userInstitution?.name.split(' ')[0]}</strong></span>
              </div>

              {finalStage !== 'USER_COLLEGE' && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>No suitable local match within your college</span>
                </div>
              )}

              {finalStage !== 'USER_COLLEGE' && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Expanding to nearby colleges (<strong className="text-white">VIT Chennai, SSN</strong>)</span>
                </div>
              )}

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-charcoal-900 border border-white/5 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Evaluating specs, distance, price, and student verification</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Best match selected: <span className="text-white">{bestMatch?.resource.title || 'Evaluating...'}</span></span>
              </div>
            </div>

            {/* Right: Collapsible REX Decision Trace */}
            <div className="bg-charcoal-950 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
              <div>
                <div 
                  onClick={() => setShowTrace(!showTrace)}
                  className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 cursor-pointer pb-2 mb-2 border-b border-white/5"
                >
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>REX Decision Trace (Action Logs)</span>
                  </span>
                  {showTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>

                {showTrace && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] font-mono text-slate-400 pr-1">
                    {decisionTrace.map((evt) => (
                      <div key={evt.id} className="flex items-start gap-2">
                        <span className="text-emerald-400 shrink-0">›</span>
                        <div>
                          <strong className="text-slate-200">{evt.action}:</strong> {evt.detail}
                        </div>
                      </div>
                    ))}
                    {isRunning && (
                      <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
                        <span>›</span>
                        <span>Executing agent evaluation...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-white/5 flex items-center justify-between">
                <span>Action-level trace</span>
                <span>Zero fabricated metrics</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Main Match Result View (Page 23 from spec) */}
      {bestMatch && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>MATCH FOUND</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Discovered via {bestMatch.stage_found.replace('_', ' ')} protocol
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Best Match Hero Card */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border-emerald-500/40 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider block font-bold">
                      {bestMatch.resource.category} • {bestMatch.resource.exchange_type}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                      {bestMatch.resource.title}
                    </h2>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      ₹{bestMatch.resource.price}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">Listing Price</span>
                  </div>
                </div>

                <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-charcoal-900 border border-white/10">
                  <img
                    src={bestMatch.resource.image_url}
                    alt={bestMatch.resource.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-charcoal-950/80 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                    Condition: {bestMatch.resource.condition}
                  </div>
                  {bestMatch.resource.is_demo && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-charcoal-950 text-[10px] font-mono font-bold">
                      DEMO RESOURCE
                    </div>
                  )}
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-xs">
                  <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">College</span>
                    <span className="font-bold text-white truncate block">{bestMatch.institution.name}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Distance</span>
                    <span className="font-bold text-emerald-400 font-mono block">
                      {bestMatch.distance_km} km
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-charcoal-900 border border-white/5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Owner</span>
                    <span className="font-bold text-slate-200 truncate block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {bestMatch.owner.name}
                    </span>
                  </div>
                </div>

                {/* Why REX Chose This */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-4 text-xs leading-relaxed text-slate-200">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                    WHY REX CHOSE THIS:
                  </span>
                  "{explanation}"
                </div>
              </div>

              {/* Offer and Action Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Your Offer Price (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={customOfferPrice}
                        onChange={(e) => setCustomOfferPrice(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-sm text-white font-mono font-bold focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex-[2] flex flex-col justify-end">
                    <button
                      onClick={() => onRequestExchange(bestMatch, customOfferPrice)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01]"
                    >
                      <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                      <span>REQUEST EXCHANGE</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-center text-slate-500 font-mono">
                  REX will autonomously submit your ₹{customOfferPrice} offer to {bestMatch.owner.name} at {bestMatch.institution.name}.
                </p>
              </div>

            </div>

            {/* Right: Map Highlighting the Route between User College and Resource College */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Geographic Exchange Route
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    ~{bestMatch.distance_km} km
                  </span>
                </div>

                <div className="h-64 sm:h-72 rounded-xl overflow-hidden mb-3 border border-white/10">
                  <RexMap
                    institutions={institutions}
                    userInstitution={userInstitution}
                    highlightResource={bestMatch.resource}
                    className="w-full h-full"
                  />
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900 border border-white/5">
                    <span className="text-slate-400">From:</span>
                    <span className="font-bold text-white">{userInstitution?.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900 border border-white/5">
                    <span className="text-slate-400">To:</span>
                    <span className="font-bold text-white">{bestMatch.institution.name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                <span>Privacy: Public campus coordinates only</span>
                <span className="text-emerald-400">Safe Handover Zone</span>
              </div>
            </div>

          </div>

          {/* Alternative Candidates */}
          {alternatives.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold mb-3">
                Other Candidates Evaluated by REX
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alternatives.map((alt) => (
                  <div
                    key={alt.resource.id}
                    onClick={() => {
                      setBestMatch(alt);
                      setCustomOfferPrice(alt.resource.price);
                    }}
                    className="glass-panel-subtle p-3.5 rounded-xl border-white/10 hover:border-slate-500 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{alt.resource.title}</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {alt.institution.name} • <span className="text-emerald-400 font-bold">₹{alt.resource.price}</span> • {alt.distance_km} km away
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">Switch →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
