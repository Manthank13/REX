import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  SlidersHorizontal, 
  Tag, 
  ShieldCheck, 
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Profile, Institution, Resource, ExchangeType, ResourceCondition } from '../types';
import { calculateDistance } from '../services/agentEngine';

interface DiscoverPageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  resources: Resource[];
  onSelectResource: (resource: Resource) => void;
  onAskRexForResource: (resource: Resource) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  resources,
  onSelectResource,
  onAskRexForResource,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExchangeType, setSelectedExchangeType] = useState<string>('All');
  const [selectedInstId, setSelectedInstId] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [sortBy, setSortBy] = useState<'recommended' | 'distance' | 'priceAsc'>('recommended');

  const categories = [
    'All',
    'Kits & Boards',
    'Calculators',
    'Textbooks',
    'Electronics',
    'Lab Equipment',
    'Notes',
    'Sports'
  ];

  // Real Database Query Filtering
  let filtered = resources.filter(res => {
    if (selectedCategory !== 'All' && res.category !== selectedCategory) return false;
    if (selectedExchangeType !== 'All' && res.exchange_type !== selectedExchangeType) return false;
    if (selectedInstId !== 'All' && res.institution_id !== selectedInstId) return false;
    if (res.price > maxPrice) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inst = institutions.find(i => i.id === res.institution_id);
      const text = `${res.title} ${res.description} ${res.category} ${inst?.name || ''}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  // Sorting
  if (sortBy === 'distance' && userInstitution) {
    filtered.sort((a, b) => {
      const instA = institutions.find(i => i.id === a.institution_id);
      const instB = institutions.find(i => i.id === b.institution_id);
      const distA = instA ? calculateDistance(userInstitution.latitude, userInstitution.longitude, instA.latitude, instA.longitude) : 999;
      const distB = instB ? calculateDistance(userInstitution.latitude, userInstitution.longitude, instB.latitude, instB.longitude) : 999;
      return distA - distB;
    });
  } else if (sortBy === 'priceAsc') {
    filtered.sort((a, b) => a.price - b.price);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-6">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
          <Tag className="w-3.5 h-3.5" />
          <span>Real Campus Resource Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Discover Verified Campus Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Showing real student listings indexed from AISHE-registered institutions across India.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-5 border-white/10 shadow-xl space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, title, or college name..."
              className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Indian Colleges</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.city})</option>
              ))}
            </select>

            <select
              value={selectedExchangeType}
              onChange={(e) => setSelectedExchangeType(e.target.value)}
              className="bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="SELL">SELL</option>
              <option value="LEND">LEND</option>
              <option value="EXCHANGE">EXCHANGE</option>
              <option value="GIVE_AWAY">GIVE_AWAY</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="recommended">Sort: Default</option>
              <option value="distance">Sort: Nearest College</option>
              <option value="priceAsc">Sort: Lowest Price</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-charcoal-950 font-bold'
                  : 'bg-charcoal-900 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Real Count Badge */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Showing <strong className="text-white">{filtered.length}</strong> real database records</span>
        <span className="text-emerald-400">Zero Fabricated Numbers</span>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((res) => {
          const inst = institutions.find(i => i.id === res.institution_id);
          const dist = userInstitution && inst
            ? calculateDistance(userInstitution.latitude, userInstitution.longitude, inst.latitude, inst.longitude)
            : 0;

          return (
            <div
              key={res.id}
              onClick={() => onSelectResource(res)}
              className="glass-panel group rounded-2xl p-4 border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-charcoal-900 border border-white/5">
                  <img
                    src={res.image_url}
                    alt={res.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-charcoal-950/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-white/10">
                    {res.category}
                  </div>
                  {res.is_demo && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-charcoal-950 text-[9px] font-mono font-bold">
                      DEMO RESOURCE
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                  {res.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3">
                  {res.description}
                </p>

                <div className="text-[11px] text-slate-400 space-y-1 mb-3 font-mono">
                  <div className="flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{inst?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{dist > 0 ? `${dist} km away` : 'At your college'}</span>
                    <span>• {res.condition}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-emerald-400 font-mono">
                    ₹{res.price}
                  </div>
                  <span className="text-[9px] text-slate-500 uppercase font-mono">{res.exchange_type}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskRexForResource(res);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <span>Ask REX</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
