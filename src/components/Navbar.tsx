import React, { useState, useEffect } from 'react';
import {
  Bot,
  Map,
  Search,
  Compass,
  PlusCircle,
  Inbox,
  Clock,
  User,
  Sparkles,
  ShieldCheck,
  Database,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import { Profile, Institution } from '../types';
import { db, RealtimePayload } from '../services/db';
import { backendAdapter } from '../services/dataAdapter';

export type NavTab =
  | 'home'
  | 'ask_rex'
  | 'discover'
  | 'network'
  | 'list_resource'
  | 'requests'
  | 'activity'
  | 'profile';

interface NavbarProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  currentUser: Profile;
  userInstitution?: Institution;
  onSwitchUser: (userId: string) => void;
  onSeedDemo: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  userInstitution,
  onSwitchUser,
  onSeedDemo,
  onOpenSettings,
}) => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const allProfiles = db.getAllProfiles();

  const updateCounts = () => {
    const { incoming } = db.getRequestsForUser(currentUser.id);
    const pending = incoming.filter(r => r.status === 'PENDING' || r.status === 'COUNTERED').length;
    setPendingRequestsCount(pending);
  };

  useEffect(() => {
    updateCounts();
    const unsub = db.subscribeRealtime(() => {
      updateCounts();
    });
    return unsub;
  }, [currentUser]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07080B]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0 select-none"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-charcoal-900 border border-emerald-500/40 group-hover:border-emerald-400 transition-colors shadow-emerald-sm">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg text-white font-sans">
                REX
              </span>
              <span className="text-[10px] tracking-wider font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                BHARAT
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Student Exchange Agent
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-charcoal-900/90 border border-white/[0.06] rounded-full p-1 shadow-inner">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              currentTab === 'home'
                ? 'bg-emerald-500 text-charcoal-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onNavigate('ask_rex')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
              currentTab === 'ask_rex'
                ? 'bg-emerald-500 text-charcoal-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask REX</span>
          </button>

          <button
            onClick={() => onNavigate('discover')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              currentTab === 'discover'
                ? 'bg-emerald-500 text-charcoal-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Discover
          </button>

          <button
            onClick={() => onNavigate('network')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
              currentTab === 'network'
                ? 'bg-emerald-500 text-charcoal-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Network</span>
          </button>

          <button
            onClick={() => onNavigate('list_resource')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
              currentTab === 'list_resource'
                ? 'bg-emerald-500 text-charcoal-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List Item</span>
          </button>

          <button
            onClick={() => onNavigate('requests')}
            className={`relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
              currentTab === 'requests'
                ? 'bg-emerald-500 text-charcoal-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-400 text-charcoal-950 font-mono text-[10px] font-extrabold flex items-center justify-center animate-bounce">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('activity')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              currentTab === 'activity'
                ? 'bg-emerald-500 text-charcoal-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Activity
          </button>
        </nav>

        {/* Right Section: User & Demo Controls */}
        <div className="flex items-center gap-2">

          {/* Environment Status Badge */}
          <div
            onClick={onOpenSettings}
            title={backendAdapter.isCloudConfigured()
              ? "Running in CLOUD MODE with shared Supabase database & Realtime"
              : "Running in DEMO MODE with browser localStorage & BroadcastChannel tab sync"}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[10px] cursor-pointer hover:border-white/20 transition-colors bg-charcoal-900 border-white/10"
          >
            <span className={`w-2 h-2 rounded-full ${backendAdapter.isCloudConfigured() ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className={backendAdapter.isCloudConfigured() ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
              {backendAdapter.isCloudConfigured() ? 'CLOUD MODE' : 'DEMO MODE'}
            </span>
          </div>

          {/* Seed Demo Button for Judges */}
          <button
            onClick={onSeedDemo}
            title="Reset and populate verified demo institutions and student resources"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-mono font-medium transition-colors"
          >
            <Database className="w-3 h-3 text-amber-400" />
            <span>Reset Demo Data</span>
          </button>

          {/* Active User Switcher (For 2-student demo flow) */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/10 hover:border-emerald-500/40 bg-charcoal-900 transition-colors"
            >
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-emerald-400/40"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-white line-clamp-1 leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 line-clamp-1">
                  {userInstitution ? userInstitution.name.split(' ')[0] : 'Campus'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl p-2 border-white/10 shadow-2xl z-50">
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>Switch Demo User</span>
                  <span className="text-amber-400 font-bold">DEMO ACCOUNTS</span>
                </div>

                {allProfiles.map((p) => {
                  const inst = db.getInstitutionById(p.institution_id);
                  const isCurrent = p.id === currentUser.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSwitchUser(p.id);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2.5 mb-1 ${
                        isCurrent
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <img src={p.avatar_url} className="w-7 h-7 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {p.name} {isCurrent && <span className="text-emerald-400 text-[10px]">(Active)</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {inst?.name || p.email}
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="pt-2 border-t border-white/10 flex justify-between items-center px-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('profile');
                    }}
                    className="text-xs text-slate-300 hover:text-white"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="text-xs text-emerald-400 font-mono hover:underline"
                  >
                    API / DB Config
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden flex items-center justify-around py-2 border-t border-white/[0.05] bg-charcoal-950 text-xs overflow-x-auto">
        <button onClick={() => onNavigate('home')} className={currentTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Home</button>
        <button onClick={() => onNavigate('ask_rex')} className={currentTab === 'ask_rex' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Ask REX</button>
        <button onClick={() => onNavigate('discover')} className={currentTab === 'discover' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Discover</button>
        <button onClick={() => onNavigate('network')} className={currentTab === 'network' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Network Map</button>
        <button onClick={() => onNavigate('list_resource')} className={currentTab === 'list_resource' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>List Item</button>
        <button onClick={() => onNavigate('requests')} className={`relative ${currentTab === 'requests' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
          Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
        </button>
        <button onClick={() => onNavigate('activity')} className={currentTab === 'activity' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Activity</button>
      </div>
    </header>
  );
};
