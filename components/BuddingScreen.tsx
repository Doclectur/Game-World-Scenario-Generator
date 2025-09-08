import React, { useState } from 'react';
import { PathHistoryItem } from '../types';
import { CyberTreeIcon } from './icons';

interface BuddingScreenProps {
  pathHistory: PathHistoryItem[];
  onCraftWorld: () => void;
}

const BuddingScreen: React.FC<BuddingScreenProps> = ({ pathHistory, onCraftWorld }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy World Bud');

  const handleCopy = () => {
    const budJson = JSON.stringify(pathHistory, null, 2);
    navigator.clipboard.writeText(budJson);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy World Bud'), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in p-4">
      <div className="w-40 h-40 mb-6 text-amber-500 opacity-80">
        <CyberTreeIcon />
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-amber-300 mb-4 [text-shadow:0_0_8px_rgba(252,165,3,0.4)]">
        World Bud Ready
      </h2>
      <p className="text-lg text-amber-200 max-w-2xl mb-8">
        Your 10-step journey is complete. The blueprint of your world is formed. You can now copy this "bud" to save or share your path, or proceed to craft the final, detailed scenario.
      </p>

      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        <button
          onClick={handleCopy}
          className="px-8 py-3 bg-transparent border-2 border-amber-600 text-amber-400 font-bold rounded-full uppercase tracking-widest hover:bg-amber-600 hover:text-gray-900 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
          {copyButtonText}
        </button>
        <button
          onClick={onCraftWorld}
          className="px-8 py-3 bg-amber-500 text-gray-900 font-bold rounded-full uppercase tracking-widest hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
          Craft World
        </button>
      </div>
    </div>
  );
};

export default BuddingScreen;
