import { useState } from 'react';
import { Key, Save, Check } from 'lucide-react';

export default function Settings() {
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('groq_api_key', groqKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold mb-8 text-white">Settings</h2>

      <div className="glass p-8 rounded-2xl max-w-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Groq API Key</h3>
            <p className="text-sm text-white/50">Used for generating AI music recommendations.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="groq_key" className="block text-sm font-medium text-white/70 mb-2">
              API Key (Client-side only)
            </label>
            <input
              id="groq_key"
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-white/40">
              Your key is saved locally in your browser and never sent to our servers.
            </p>
            <button
              onClick={handleSave}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                saved 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
