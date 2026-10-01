'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  price: number;
  condition: string;
  status: string;
  institution: { name: string; city: string }[];
  distance_km: number | null;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStates, setSearchStates] = useState<string[]>([]);
  const [result, setResult] = useState<{ search_level: string, expanded: boolean, results: SearchResult[] } | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setSearchStates(['Understanding your request...', 'Need identified', 'Prefer my college']);
    setResult(null);
    setError('');

    try {
      // Fake delays to simulate agentic progressive thinking in UI
      await new Promise(r => setTimeout(r, 800));
      setSearchStates(s => [...s, 'Searching SRM Institute of Science and Technology']);
      
      await new Promise(r => setTimeout(r, 1000));
      setSearchStates(s => [...s, 'Checking availability', 'No suitable match found', 'Expanding student network', 'Searching nearby institutions']);

      const res = await fetch(`/api/resources/search?q=${encodeURIComponent(query)}&expand=true`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      await new Promise(r => setTimeout(r, 600));

      if (data.results && data.results.length > 0) {
        setSearchStates(s => [...s, 'Match found']);
        setResult(data);
      } else {
        setSearchStates(s => [...s, 'No matches found across the network']);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDemoFill = () => {
    setQuery('I need a Raspberry Pi for this weekend. Preferably from my college.');
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-8 flex flex-col gap-12">
      <div className="flex flex-col gap-4 text-center items-center">
        <h1 className="text-4xl font-semibold">What do you need?</h1>
        <p className="text-[var(--text-muted)]">REX searches your campus first, then expands through the student network when needed.</p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-xl p-2 shadow-xl focus-within:border-[var(--accent)] transition-colors">
        <div className="flex">
          <input 
            type="text" 
            className="flex-1 bg-transparent border-none outline-none text-lg px-4 py-3 placeholder:text-[var(--text-dim)]"
            placeholder="I need a Raspberry Pi for this weekend..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isSearching}
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching || !query}
            className="bg-[var(--accent)] text-[#050706] font-medium px-6 py-3 rounded-lg hover:bg-[#2bc475] disabled:opacity-50 transition-colors"
          >
            Ask REX
          </button>
        </div>
      </div>

      {!isSearching && !result && (
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={handleDemoFill} className="px-4 py-2 rounded-full border border-[var(--border-color)] text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">Raspberry Pi</button>
          <button className="px-4 py-2 rounded-full border border-[var(--border-color)] text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">Arduino kit</button>
          <button className="px-4 py-2 rounded-full border border-[var(--border-color)] text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">DBMS textbook</button>
          <button className="px-4 py-2 rounded-full border border-[var(--border-color)] text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">Scientific calculator</button>
        </div>
      )}

      {searchStates.length > 0 && (
        <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
          <div className="flex flex-col gap-3 font-mono text-sm bg-[var(--card)] p-6 rounded-xl border border-[var(--border-color)]">
            <div className="text-[var(--accent)] font-bold mb-2">REX AGENT EXECUTION</div>
            {searchStates.map((state, i) => {
              const isMatch = state.includes('Match found');
              const isFail = state.includes('No matches') || state.includes('No suitable');
              const isExp = state.includes('Expanding');
              
              let prefix = '◌';
              if (isMatch) prefix = '✓';
              if (isExp) prefix = '→';
              
              return (
                <div key={i} className={`flex gap-3 ${isMatch ? 'text-[var(--accent)]' : (isFail ? 'text-red-400' : 'text-[var(--text-muted)]')}`}>
                  <span>{prefix}</span>
                  <span>{state}</span>
                </div>
              );
            })}
            {isSearching && (
              <div className="flex gap-3 text-[var(--text-dim)] animate-pulse">
                <span>◌</span>
                <span>...</span>
              </div>
            )}
          </div>
          
          {error && <div className="text-red-400 text-center">{error}</div>}

          {result && result.results.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-medium border-b border-[var(--border-color)] pb-2 mb-2">Top Match ({result.search_level})</h3>
              {result.results.map((r) => {
                const inst = Array.isArray(r.institution) ? r.institution[0] : r.institution;
                return (
                  <div key={r.id} className="bg-[var(--card)] border border-[var(--border-color)] p-6 rounded-xl flex justify-between items-center hover:border-[var(--text-dim)] transition-colors">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-xl font-medium text-[var(--accent)]">{r.title}</h4>
                      <p className="text-[var(--text-muted)]">{inst?.name}</p>
                      <div className="flex gap-3 text-sm mt-2">
                        <span className="bg-[#1a221d] px-2 py-1 rounded text-[var(--foreground)]">₹{r.price}</span>
                        <span className="bg-[#1a221d] px-2 py-1 rounded text-[var(--foreground)]">{r.condition}</span>
                        {r.distance_km && <span className="bg-[var(--accent-faint)] text-[var(--accent)] px-2 py-1 rounded">{r.distance_km.toFixed(1)} km away</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => router.push(`/discover/${r.id}`)}
                        className="bg-white text-black font-medium px-4 py-2 rounded shadow-sm hover:bg-gray-200"
                      >
                        Request this
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
