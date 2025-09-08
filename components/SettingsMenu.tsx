import React, { useState, useEffect } from 'react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  const [mistralApiKey, setMistralApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiOrgId, setOpenaiOrgId] = useState('');

  useEffect(() => {
    const savedMistralKey = localStorage.getItem('mistral_api_key');
    if (savedMistralKey) {
      setMistralApiKey(savedMistralKey);
    }
    const savedOpenaiKey = localStorage.getItem('openai_api_key');
    if (savedOpenaiKey) {
      setOpenaiApiKey(savedOpenaiKey);
    }
    const savedOpenaiOrgId = localStorage.getItem('openai_organization_id');
    if (savedOpenaiOrgId) {
      setOpenaiOrgId(savedOpenaiOrgId);
    }
  }, []);

  const handleSave = () => {
    if (mistralApiKey.trim()) {
      localStorage.setItem('mistral_api_key', mistralApiKey.trim());
    } else {
      localStorage.removeItem('mistral_api_key');
    }

    if (openaiApiKey.trim()) {
      localStorage.setItem('openai_api_key', openaiApiKey.trim());
    } else {
      localStorage.removeItem('openai_api_key');
    }

    if (openaiOrgId.trim()) {
      localStorage.setItem('openai_organization_id', openaiOrgId.trim());
    } else {
      localStorage.removeItem('openai_organization_id');
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
          Optionally provide your own API keys. If provided, the application will use the specified service for generation, falling back to the default Gemini configuration if left blank.
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
        <div className="mb-6">
          <label htmlFor="openai-key" className="block text-sm font-medium text-amber-400 mb-2">OpenAI API Key</label>
          <input
            type="password"
            id="openai-key"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-md text-amber-100 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="openai-org" className="block text-sm font-medium text-amber-400 mb-2">OpenAI Organization ID (Optional)</label>
          <input
            type="text"
            id="openai-org"
            value={openaiOrgId}
            onChange={(e) => setOpenaiOrgId(e.target.value)}
            placeholder="Enter your Organization ID (e.g., org-...)"
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