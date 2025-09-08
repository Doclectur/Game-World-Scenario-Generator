import React, { useState } from 'react';
import { CyberTreeIcon, SettingsIcon } from './icons';

interface StartScreenProps {
  onStart: (budJson?: string) => void;
  onOpenSettings: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenSettings }) => {
  const [budJson, setBudJson] = useState('');

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in relative w-full max-w-4xl">
      <div className="absolute top-4 right-4">
        <button
          onClick={onOpenSettings}
          className="p-2 text-amber-400 hover:text-amber-200 transition-colors duration-200"
          aria-label="Open advanced settings"
        >
          <div className="w-8 h-8">
            <SettingsIcon />
          </div>
        </button>
      </div>

      <div className="w-48 h-48 mb-8 text-amber-400">
        <CyberTreeIcon />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold text-amber-300 tracking-widest uppercase mb-4 [text-shadow:0_0_10px_rgba(252,165,3,0.5)]">
        Scenario Generator
      </h1>
      <p className="text-lg text-amber-200 max-w-2xl mb-8">
        Collaborate with an AI to create a unique world. Your choices will define its history, its people, and its fate. The final result is a detailed JSON scenario, ready for you to use in your own worlds.
      </p>
      <button
        onClick={() => onStart()}
        className="px-8 py-3 bg-amber-500 text-gray-900 font-bold rounded-full uppercase tracking-widest hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out"
      >
        Begin Forging
      </button>

      <div className="mt-10 p-4 border border-amber-800 rounded-lg bg-stone-800/30 w-full max-w-lg">
          <label htmlFor="bud-paste" className="block text-sm uppercase text-amber-500 tracking-widest mb-2">Resume a Journey</label>
          <textarea
            id="bud-paste"
            value={budJson}
            onChange={(e) => setBudJson(e.target.value)}
            placeholder="Paste the bud of a previous journey..."
            className="w-full h-24 px-3 py-2 bg-stone-900 border border-amber-900 rounded-md text-amber-100 focus:ring-amber-500 focus:border-amber-500 text-xs"
          />
          {budJson && (
             <button
                onClick={() => onStart(budJson)}
                className="mt-3 px-6 py-2 bg-transparent border-2 border-amber-600 text-amber-400 font-bold rounded-full uppercase tracking-widest text-sm hover:bg-amber-600 hover:text-gray-900 transform transition-all duration-300"
            >
                Load Bud and Craft World
            </button>
          )}
      </div>


      <div className="absolute bottom-4 left-4 text-xs text-amber-700">
        v3.6
      </div>
    </div>
  );
};

export default StartScreen;