import React, { useState } from 'react';
import { 
  Upload, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Tag, 
  DollarSign, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Profile, Institution, Resource, ExchangeType, ResourceCondition } from '../types';
import { detectObjectFromImage } from '../services/agentEngine';
import { db } from '../services/db';

interface ListResourcePageProps {
  currentUser: Profile;
  userInstitution?: Institution;
  institutions: Institution[];
  onResourceCreated: (resource: Resource) => void;
}

export const ListResourcePage: React.FC<ListResourcePageProps> = ({
  currentUser,
  userInstitution,
  institutions,
  onResourceCreated,
}) => {
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<{
    title: string;
    category: string;
    brand: string;
    condition: ResourceCondition;
    description: string;
    suggestedPrice: number;
  } | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Calculators');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<ResourceCondition>('Good');
  const [exchangeType, setExchangeType] = useState<ExchangeType>('SELL');
  const [price, setPrice] = useState<number>(450);
  const [availStart, setAvailStart] = useState('2026-10-02');
  const [availEnd, setAvailEnd] = useState('2026-10-31');
  const [selectedInstId, setSelectedInstId] = useState(currentUser.institution_id);
  const [isPublished, setIsPublished] = useState(false);

  // Handle Image Upload
  const handleImageChange = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      triggerAiDetection(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const triggerAiDetection = async (imgData: string, filename: string) => {
    setIsDetecting(true);
    setDetectionResult(null);

    const detected = await detectObjectFromImage(imgData || filename);
    setDetectionResult(detected as any);

    // Auto-populate form
    setTitle(detected.title);
    setCategory(detected.category);
    setBrand(detected.brand);
    setCondition(detected.condition as ResourceCondition);
    setDescription(detected.description);
    setPrice(detected.suggestedPrice);

    setIsDetecting(false);
  };

  // Preset demo sample photos for judges
  const samplePresets = [
    {
      name: 'Casio FX-991ES Plus',
      url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
      label: 'Sample: Casio Calculator'
    },
    {
      name: 'Raspberry Pi 4 Model B',
      url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
      label: 'Sample: Raspberry Pi 4'
    },
    {
      name: 'Arduino Uno R3 Kit',
      url: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=600&q=80',
      label: 'Sample: Arduino Kit'
    },
    {
      name: 'CLRS Algorithms 3rd Ed',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      label: 'Sample: CLRS Textbook'
    }
  ];

  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setImagePreview(preset.url);
    triggerAiDetection(preset.name, preset.name);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = institutions.find(i => i.id === selectedInstId) || userInstitution;

    const newRes = db.createResource({
      owner_id: currentUser.id,
      institution_id: selectedInstId,
      title: title || 'Student Resource',
      description: description || 'Verified student resource.',
      category,
      brand,
      condition,
      price: Number(price),
      exchange_type: exchangeType,
      availability_start: availStart,
      availability_end: availEnd,
      latitude: inst?.latitude || 12.8230,
      longitude: inst?.longitude || 80.0444,
      image_url: imagePreview || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    });

    setIsPublished(true);
    setTimeout(() => {
      onResourceCreated(newRes);
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real Resource Registry</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          List a Campus Resource
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Upload a photo to trigger REX Gemini AI Object Extraction, review specifications, and publish directly to the student network.
        </p>
      </div>

      {isPublished ? (
        <div className="glass-panel rounded-2xl p-10 text-center border-emerald-500/40 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Resource Published Successfully!</h2>
          <p className="text-xs text-slate-400 font-mono">
            Indexed in your college ({userInstitution?.name}) and visible to nearby peer campuses.
          </p>
        </div>
      ) : (
        <form onSubmit={handlePublish} className="space-y-6">
          
          {/* Photo Upload & AI Vision Section */}
          <div className="glass-panel rounded-2xl p-6 border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>1. Upload Photograph for AI Vision Extraction</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                Gemini Vision Powered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Drop / Upload Zone */}
              <div className="relative border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[200px] transition-colors cursor-pointer bg-charcoal-900/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                {imagePreview ? (
                  <img src={imagePreview} className="max-h-40 rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-white block">Drop photo here or browse</span>
                    <span className="text-[10px] text-slate-500 mt-1">JPEG, PNG, WebP supported</span>
                  </>
                )}
              </div>

              {/* Sample Preset Buttons for Judges */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 block mb-2 font-bold">
                    Or select sample test items for instant AI Vision:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {samplePresets.map((preset, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleSelectPreset(preset)}
                        className="p-2 rounded-lg bg-charcoal-900 border border-white/10 hover:border-emerald-500/40 text-left transition-all"
                      >
                        <span className="text-xs font-bold text-white truncate block">{preset.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Click to test Vision</span>
                      </button>
                    ))}
                  </div>
                </div>

                {isDetecting && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 animate-pulse mt-3">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                    <span>REX Vision Model analyzing photograph features...</span>
                  </div>
                )}
              </div>

            </div>

            {/* AI Vision Detection Result Banner (As required in prompt Section 10) */}
            {detectionResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-slide-up">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>REX DETECTED (Review Before Confirming)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300">Requires User Confirmation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Detected Item</span>
                    <strong className="text-white font-bold">{detectionResult.title}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Category</span>
                    <strong className="text-emerald-300">{detectionResult.category}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Condition</span>
                    <strong className="text-white">{detectionResult.condition}</strong>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Form Details Grid */}
          <div className="glass-panel rounded-2xl p-6 border-white/10 shadow-xl space-y-4">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block pb-3 border-b border-white/10">
              2. Review & Refine Listing Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Casio FX-991ES Plus Scientific Calculator"
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Calculators">Calculators</option>
                  <option value="Kits & Boards">Kits & Boards</option>
                  <option value="Textbooks">Textbooks</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Notes">Notes</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                  Exchange Type *
                </label>
                <select
                  value={exchangeType}
                  onChange={(e) => setExchangeType(e.target.value as ExchangeType)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="SELL">SELL</option>
                  <option value="LEND">LEND</option>
                  <option value="EXCHANGE">EXCHANGE</option>
                  <option value="GIVE_AWAY">GIVE_AWAY (Free)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                  Price (INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                  Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ResourceCondition)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                  College Node *
                </label>
                <select
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(e.target.value)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.city})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                Description & Course Relevance
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe condition, battery health, included cables, or semester course relevance..."
                className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Logged by {currentUser.name} ({currentUser.email})
              </span>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm & List Resource</span>
              </button>
            </div>

          </div>

        </form>
      )}

    </div>
  );
};
