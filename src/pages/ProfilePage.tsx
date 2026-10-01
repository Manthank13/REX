import React from 'react';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Mail, 
  GraduationCap, 
  Calendar, 
  Tag, 
  Database,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { Profile, Institution, Resource } from '../types';
import { db } from '../services/db';

interface ProfilePageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  onSwitchUser: (userId: string) => void;
  onSelectResource: (res: Resource) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  onSwitchUser,
  onSelectResource,
}) => {
  const allProfiles = db.getAllProfiles();
  const userResources = db.getResources({ status: 'ACTIVE' }).filter(r => r.owner_id === currentUser.id);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Student Institutional Identity</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Verified Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Institution verification mapped against government AISHE higher education registries.
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border-white/10 shadow-2xl relative">
        {currentUser.is_demo && (
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
              DEMO ACCOUNT
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-white/10 text-center sm:text-left">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-emerald-sm"
          />

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-bold text-white">{currentUser.name}</h2>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Institutional Verified</span>
              </div>
            </div>

            <p className="text-sm font-mono text-slate-300">
              {currentUser.email}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                {userInstitution?.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.department} ({currentUser.year})
              </span>
            </div>
          </div>
        </div>

        {/* College & Verification Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-xs">
          <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">AISHE Institution</span>
            <span className="font-bold text-white block truncate">{userInstitution?.name}</span>
            <span className="text-[10px] font-mono text-emerald-400">{userInstitution?.aishe_code}</span>
          </div>

          <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Verification Method</span>
            <span className="font-bold text-white block">Institutional Email Token</span>
            <span className="text-[10px] text-slate-400">@srmist.edu.in</span>
          </div>

          <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Campus Listings</span>
            <span className="font-bold text-emerald-400 block font-mono text-base">{userResources.length} items</span>
            <span className="text-[10px] text-slate-400">Active on REX Mesh</span>
          </div>
        </div>

        {/* Demo Switcher for Hackathon Judges */}
        <div className="p-4 rounded-xl bg-charcoal-950 border border-amber-500/25">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Switch Demo Account (For Two-Student Negotiation Demo)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Test Multi-College Workflow</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {allProfiles.map((p) => {
              const inst = institutions.find(i => i.id === p.institution_id);
              const isSelected = p.id === currentUser.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSwitchUser(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                      : 'bg-charcoal-900 border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={p.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">{inst?.name.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Resources Listed By Current User */}
      <div>
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider mb-4">
          Resources Listed By You ({userResources.length})
        </h3>

        {userResources.length === 0 ? (
          <div className="p-6 rounded-2xl glass-panel text-center border-dashed border-white/10 text-xs text-slate-400">
            You haven't listed any resources yet. Use "List Item" to publish textbooks, tools, or electronics.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {userResources.map((res) => (
              <div
                key={res.id}
                onClick={() => onSelectResource(res)}
                className="glass-panel p-4 rounded-xl border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all space-y-2"
              >
                <div className="h-28 rounded-lg overflow-hidden bg-charcoal-900">
                  <img src={res.image_url} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xs font-bold text-white truncate">{res.title}</h4>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">₹{res.price}</span>
                  <span className="text-slate-400 text-[10px]">{res.condition}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
