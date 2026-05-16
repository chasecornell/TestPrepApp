import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Camera, X, Check, Trash2, User, ChevronLeft } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  user: UserProfile;
  onUpdate: (updated: Partial<UserProfile>) => void;
  onExit: () => void;
}

const CHARACTER_PRESETS = [
  'pixel-art',
  'avataaars',
  'bottts',
  'micah',
  'miniavs',
  'open-peeps',
  'croodles',
  'big-ears',
];

export default function ProfileSettings({ user, onUpdate, onExit }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempPhotoURL, setTempPhotoURL] = useState(user.photoURL || '');

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<UserProfile> = {
        displayName,
        photoURL: tempPhotoURL,
      };
      await updateDoc(doc(db, 'users', user.uid), updates);
      onUpdate(updates);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectCharacter = (style: string) => {
    const seed = Math.floor(Math.random() * 1000000);
    setTempPhotoURL(`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <button 
        onClick={onExit}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
      >
        <ChevronLeft className="w-4 h-4" /> Back to HUD
      </button>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter self-start sm:self-auto">Profile <span className="text-neon-cyan">Settings</span></h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-neon-cyan text-black font-black rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'SYNCING...' : 'SAVE CHANGES'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="space-y-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Neuro-ID Icon</div>
          <div className="relative group">
            <img 
              src={tempPhotoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`} 
              className="w-full aspect-square rounded-3xl bg-white/5 border-2 border-white/10 object-cover" 
              alt="Profile" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-3xl gap-2"
            >
              <Camera className="w-8 h-8 text-neon-cyan" />
              <span className="text-[10px] font-black text-white">UPLOAD IMAGE</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
          <div className="text-[9px] text-gray-500 italic text-center">
            Upload your own or generate a new neuro-link avatar below.
          </div>
        </div>

        {/* Info Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Displayed Handle</span>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-colors font-bold"
                placeholder="V-Explorer"
              />
            </label>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">Quick-Sync Characters</div>
              <div className="grid grid-cols-4 gap-2">
                {CHARACTER_PRESETS.map((style) => (
                  <button
                    key={style}
                    onClick={() => selectCharacter(style)}
                    className="p-1 rounded-lg border border-white/5 hover:border-neon-cyan transition-colors bg-black/20"
                  >
                    <img 
                      src={`https://api.dicebear.com/7.x/${style}/svg?seed=preview`} 
                      className="w-full aspect-square" 
                      alt={style}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <User className="w-12 h-12 text-neon-cyan" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-neon-cyan mb-2">Secure Profile Sync</div>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Your profile is verified via Google SSO. Updating your display name here only changes how it appears within Velocity Prep.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
