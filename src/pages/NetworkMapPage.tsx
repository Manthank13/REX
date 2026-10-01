import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Search, 
  Filter, 
  Layers, 
  Compass, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Institution, Profile, Resource } from '../types';
import { RexMap } from '../components/RexMap';
import { db } from '../services/db';

interface NetworkMapPageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  onSelectResource: (res: Resource) => void;
  onAskRexForCollege: (inst: Institution) => void;
}

export const NetworkMapPage: React.FC<NetworkMapPageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  onSelectResource,
  onAskRexForCollege,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(userInstitution?.id || institutions[0].id);
  const [zoomLevel, setZoomLevel] = useState<'INDIA' | 'STATE' | 'CITY' | 'COLLEGE'>('CITY');
  const [searchFilter, setSearchFilter] = useState('');

  const selectedInst = institutions.find(i => i.id === selectedInstId) || institutions[0];
  const allResources = db.getResources({ status: 'ACTIVE' });
  const instResources = allResources.filter(r => r.institution_id === selectedInst.id);
  const instProfiles = db.getAllProfiles().filter(p => p.institution_id === selectedInst.id);

  const filteredInstitutions = institutions.filter(inst => 
    !searchFilter.trim() || 
    `${inst.name} ${inst.city} ${inst.state} ${inst.aishe_code}`.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in space-y-6">
      
      {/* Page Title & Map Scope Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>National Geospatial Campus Mesh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AISHE College Network Map
          </h1>
          <p className="text-xs text-slate-400">
            Real higher education institutions from Government of India AISHE / Open Government Data directory
          </p>
        </div>

        {/* Viewport Zoom Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-charcoal-900 border border-white/10 self-start md:self-auto font-mono text-xs">
          <button
            onClick={() => {
              setZoomLevel('COLLEGE');
              if (userInstitution) setSelectedInstId(userInstitution.id);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              zoomLevel === 'COLLEGE' ? 'bg-emerald-500 text-charcoal-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            MY COLLEGE
          </button>
          <button
            onClick={() => setZoomLevel('CITY')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              zoomLevel === 'CITY' ? 'bg-emerald-500 text-charcoal-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            NEARBY / CITY
          </button>
          <button
            onClick={() => setZoomLevel('STATE')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              zoomLevel === 'STATE' ? 'bg-emerald-500 text-charcoal-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            STATE
          </button>
          <button
            onClick={() => setZoomLevel('INDIA')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              zoomLevel === 'INDIA' ? 'bg-emerald-500 text-charcoal-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            INDIA
          </button>
        </div>
      </div>

      {/* Main Map + Institution Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[650px]">
        
        {/* Left: Map Container */}
        <div className="lg:col-span-8 h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <RexMap
            institutions={institutions}
            selectedInstitutionId={selectedInstId}
            onSelectInstitution={(inst) => setSelectedInstId(inst.id)}
            userInstitution={userInstitution}
            zoomLevel={zoomLevel}
            className="w-full h-full"
          />
        </div>

        {/* Right: Selected Institution Card & Active Resources */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border-white/10 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Institution Search */}
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search college, city, or AISHE..."
                className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>

            {/* Quick list of institutions if searching */}
            {searchFilter.trim() && (
              <div className="mb-4 max-h-36 overflow-y-auto space-y-1 pr-1">
                {filteredInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      setSelectedInstId(inst.id);
                      setSearchFilter('');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-charcoal-900/60 hover:bg-emerald-500/10 border border-white/5 text-xs text-white truncate"
                  >
                    {inst.name} ({inst.city})
                  </button>
                ))}
              </div>
            )}

            {/* Institution Details Header */}
            <div className="pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                  AISHE Code: {selectedInst.aishe_code}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedInst.institution_type}
                </span>
              </div>

              <h2 className="text-lg font-bold text-white leading-snug">
                {selectedInst.name}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                {selectedInst.address} • {selectedInst.city}, {selectedInst.state}
              </p>
            </div>

            {/* Real Counts (No fake metrics) */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Active Resources</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {instResources.length}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Real DB records</span>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Verified Profiles</span>
                <span className="text-base font-extrabold text-white font-mono">
                  {instProfiles.length}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Institutional ID</span>
              </div>
            </div>

            {/* Active Resources at this college */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-bold mb-2">
                <span>Resources at this College ({instResources.length})</span>
              </div>

              {instResources.length === 0 ? (
                <div className="p-4 rounded-xl bg-charcoal-900/60 border border-dashed border-white/10 text-center text-xs text-slate-400">
                  No active resources currently listed at {selectedInst.name.split(' ')[0]}.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {instResources.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => onSelectResource(res)}
                      className="p-2.5 rounded-xl bg-charcoal-900 border border-white/5 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-white truncate">{res.title}</h4>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {res.category} • {res.condition}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-400 font-mono">₹{res.price}</span>
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">{res.exchange_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action: Ask REX to find or exchange at this college */}
          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={() => onAskRexForCollege(selectedInst)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs tracking-wide shadow-md transition-all"
            >
              <span>Ask REX for Resources Here</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
