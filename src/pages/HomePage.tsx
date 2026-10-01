import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Compass, 
  CheckCircle2, 
  Tag, 
  Database,
  Radio
} from 'lucide-react';
import { Profile, Institution, Resource } from '../types';
import { RexMap } from '../components/RexMap';
import { calculateDistance } from '../services/agentEngine';

interface HomePageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  recentResources: Resource[];
  onSubmitGoal: (goal: string) => void;
  onExploreCollege: (inst: Institution) => void;
  onSelectResource: (res: Resource) => void;
  onNavigateToNetwork: () => void;
  onSeedDemo: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  recentResources,
  onSubmitGoal,
  onExploreCollege,
  onSelectResource,
  onNavigateToNetwork,
  onSeedDemo,
}) => {
  const [goalInput, setGoalInput] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalInput.trim()) {
      onSubmitGoal(goalInput.trim());
    } else {
      onSubmitGoal("I need a Raspberry Pi for this weekend. Preferably from my college.");
    }
  };

  const samplePrompts = [
    "I need a Raspberry Pi for this weekend. Preferably from my college.",
    "I need a DSA textbook for two weeks under ₹400.",
    "Looking for Casio FX-991ES calculator for exam tomorrow under ₹500",
    "Need an Arduino starter kit for hackathon prototype",
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in space-y-12">
      
      {/* Demo Mode Notice for Judges */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>DEMO DATASET ACTIVE:</strong> You are currently logged in as <strong className="text-white underline">{currentUser.name}</strong> from <strong className="text-white">{userInstitution?.name}</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-amber-300">AISHE Verified Institutions</span>
          <button
            onClick={onSeedDemo}
            className="px-2 py-1 rounded bg-amber-500 text-charcoal-950 font-bold font-mono text-[10px] hover:bg-amber-400 transition-colors"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold mb-4">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Bharat Agentic AI Network</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          REX
        </h1>
        
        <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-200">
          India's Autonomous Student Exchange Agent
        </p>

        <p className="mt-2 text-base sm:text-lg text-emerald-400 font-medium">
          "Don't search the campus. Ask REX."
        </p>

        {/* Natural Language Goal Input */}
        <form onSubmit={handleFormSubmit} className="mt-8 max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/40 via-teal-500/20 to-emerald-500/40 blur-md opacity-40 group-focus-within:opacity-100 transition duration-300" />
          
          <div className="relative glass-panel rounded-2xl p-2 sm:p-2.5 border-white/10 group-focus-within:border-emerald-500/50 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-3 flex-1 px-3 py-2">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="What do you need? (e.g. Raspberry Pi for this weekend...)"
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <span>ASK REX</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setGoalInput(p);
                onSubmitGoal(p);
              }}
              className="text-xs px-3 py-1 rounded-lg border border-white/[0.06] bg-charcoal-900/60 text-slate-300 hover:border-emerald-500/40 hover:text-white transition-all text-left"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {/* Network Overview Grid: Your College vs Nearby Colleges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Your Network Card */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  Your College Network
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Primary Node
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              {userInstitution?.name}
            </h3>
            
            <p className="text-xs text-slate-400 mb-4">
              {userInstitution?.address} • {userInstitution?.city}, {userInstitution?.state}
            </p>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 rounded-xl bg-charcoal-900 border border-white/[0.05]">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">AISHE Code</span>
                <span className="text-sm font-bold font-mono text-emerald-400">{userInstitution?.aishe_code}</span>
              </div>
              <div className="p-3 rounded-xl bg-charcoal-900 border border-white/[0.05]">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Type</span>
                <span className="text-xs font-semibold text-slate-200 truncate block">{userInstitution?.institution_type}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-charcoal-900/60 border border-white/[0.06] text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Active local listings:</span>
                <span className="font-bold text-white font-mono">
                  {recentResources.filter(r => r.institution_id === userInstitution?.id).length} resources
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Institutional domain:</span>
                <span className="font-mono text-emerald-400">@{userInstitution?.website.replace('https://www.', '').replace('http://www.', '').split('/')[0]}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">Verified College ID</span>
            <button
              onClick={() => userInstitution && onExploreCollege(userInstitution)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Explore campus listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Nearby Network Interactive Map Preview */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                Nearby College Mesh
              </span>
            </div>

            <button
              onClick={onNavigateToNetwork}
              className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Open Full Network Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="w-full h-64 rounded-xl overflow-hidden mb-3 border border-white/10">
            <RexMap
              institutions={institutions}
              userInstitution={userInstitution}
              className="w-full h-full min-h-[250px]"
              zoomLevel="CITY"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Real OpenStreetMap geographic coordinates</span>
            <span className="text-emerald-400 font-bold">Autonomous Stage 2 Expansion Ready</span>
          </div>
        </div>

      </div>

      {/* Recent Resources (Real Database Records Only) */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Recent Campus Resources</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Real DB Records
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Discovered from verified student profiles across Chennai and national institutions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentResources.map((res) => {
            const inst = institutions.find(i => i.id === res.institution_id);
            const dist = userInstitution && inst
              ? calculateDistance(userInstitution.latitude, userInstitution.longitude, inst.latitude, inst.longitude)
              : 0;

            return (
              <div
                key={res.id}
                onClick={() => onSelectResource(res)}
                className="glass-panel group rounded-xl p-4 border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-32 rounded-lg overflow-hidden mb-3 bg-charcoal-900 border border-white/5">
                    <img
                      src={res.image_url}
                      alt={res.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-950/80 text-emerald-400 border border-white/10 backdrop-blur-md">
                        {res.category}
                      </span>
                    </div>

                    {res.is_demo && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/90 text-charcoal-950 font-bold">
                          DEMO RESOURCE
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {res.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3">
                    {res.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-white">
                      ₹{res.price}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{inst ? inst.name.split(' ')[0] : 'Campus'}</span>
                      {dist > 0 && <span className="font-mono text-emerald-400">({dist} km)</span>}
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-charcoal-950 transition-colors">
                    View
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
