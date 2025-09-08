import React, { useState, useEffect } from 'react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  const [mistralApiKey, setMistralApiKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('mistral_api_key');
    if (savedKey) {
      setMistralApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    if (mistralApiKey.trim()) {
      localStorage.setItem('mistral_api_key', mistralApiKey.trim());
    } else {
      localStorage.removeItem('mistral_api_key');
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-stone-800 border border-amber-700/50 rounded-lg shadow-2xl shadow-amber-900/50 p-8 w-full max-w-md text-amber-100" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-amber-300 mb-4">Advanced Settings</h2>
        <p className="text-amber-200 mb-6">
          Optionally provide your own Mistral API key. If provided, the application will use Mistral (La Plateforme) for generation. If left blank, it will revert to the default Gemini configuration.
        </p>
        <div className="mb-6">
          <label htmlFor="mistral-key" className="block text-sm font-medium text-amber-400 mb-2">Mistral API Key</label>
          <input
            type="password"
            id="mistral-key"
            value={mistralApiKey}
            onChange={(e) => setMistralApiKey(e.target.value)}
            placeholder="Enter your Mistral API key"
            className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-md text-amber-100 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-transparent border-2 border-stone-600 text-stone-300 font-bold rounded-full uppercase tracking-widest hover:bg-stone-700 hover:text-white transform transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-amber-500 text-gray-900 font-bold rounded-full uppercase tracking-widest hover:bg-amber-400 transform transition-all duration-300"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;