import React, { useState } from 'react';
import { Sparkles, Key, Database, Check, X, Shield } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState(
    localStorage.getItem('rex_gemini_api_key') || ''
  );
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('rex_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('rex_supabase_anon_key') || ''
  );
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (geminiKey.trim()) localStorage.setItem('rex_gemini_api_key', geminiKey.trim());
    else localStorage.removeItem('rex_gemini_api_key');

    if (supabaseUrl.trim()) localStorage.setItem('rex_supabase_url', supabaseUrl.trim());
    else localStorage.removeItem('rex_supabase_url');

    if (supabaseKey.trim()) localStorage.setItem('rex_supabase_anon_key', supabaseKey.trim());
    else localStorage.removeItem('rex_supabase_anon_key');

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border-white/10 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              REX Integration Settings
            </h3>
            <p className="text-xs text-slate-400">
              Configure Google Gemini & Supabase Services
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          REX runs fully out-of-the-box with reactive cross-tab realtime and deterministic agent reasoning. You can optionally connect live cloud keys below:
        </p>

        {/* Gemini API Key */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1 font-bold">
              Google Gemini API Key (Vision & Intent)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
          </div>

          {/* Supabase URL */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1 font-bold">
              Supabase Project URL
            </label>
            <div className="relative">
              <Database className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
          </div>

          {/* Supabase Anon Key */}
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1 font-bold">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-charcoal-900 border border-white/5 text-[11px] text-slate-400 mb-5 flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Keys are saved in local browser storage only. Cross-tab BroadcastChannel real-time negotiation is fully active.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
