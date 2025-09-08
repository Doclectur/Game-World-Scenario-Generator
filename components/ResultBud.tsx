import React, { useState } from 'react';
import { Result } from '../types';
import { BuddingFlowerIcon } from './icons';

interface ResultScreenProps {
  result: Result | null;
  onRestart: () => void;
  isError?: boolean;
  onRetry?: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onRestart, isError, onRetry }) => {
  const [copyButtonText, setCopyButtonText] = useState('Click to Copy JSON');

  const handleCopy = () => {
    if (result?.scenarioJson) {
      try {
        // Prettify the JSON before copying
        const parsedJson = JSON.parse(result.scenarioJson);
        const prettyJson = JSON.stringify(parsedJson, null, 2);
        navigator.clipboard.writeText(prettyJson);
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Click to Copy JSON'), 2000);
      } catch (error) {
        console.error("Failed to parse or copy JSON:", error);
        // Fallback for invalid JSON string
        navigator.clipboard.writeText(result.scenarioJson);
        setCopyButtonText('Copied as text!');
        setTimeout(() => setCopyButtonText('Click to Copy JSON'), 2000);
      }
    }
  };


  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-40 h-40 mb-6 text-amber-400">
            <BuddingFlowerIcon />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-amber-300 mb-4 [text-shadow:0_0_8px_rgba(252,165,3,0.4)]">
            {isError ? "Forge Interrupted" : "Your World Forged"}
        </h2>
      {result ? (
        <div className="w-full max-w-2xl p-6 bg-stone-800/50 border border-amber-700/50 rounded-lg shadow-2xl shadow-amber-900/50">
          <p className="text-lg text-amber-100 mb-6">
            {result.summary}
          </p>
          {!isError && result.scenarioJson && result.scenarioJson !== "{}" && (
             <button
              onClick={handleCopy}
              className="inline-block px-6 py-3 bg-amber-500 text-gray-900 font-bold rounded-full uppercase tracking-widest hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out"
            >
              {copyButtonText}
            </button>
          )}
        </div>
      ) : (
        <p>Loading result...</p>
      )}
      <div className="flex items-center space-x-4 mt-10">
        <button
            onClick={onRestart}
            className="px-8 py-3 bg-transparent border-2 border-amber-600 text-amber-400 font-bold rounded-full uppercase tracking-widest hover:bg-amber-600 hover:text-gray-900 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
            Forge a New World
        </button>
        {isError && onRetry && (
            <button
                onClick={onRetry}
                className="px-8 py-3 bg-amber-500 text-gray-900 font-bold rounded-full uppercase tracking-widest hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out"
            >
                Try Again
            </button>
        )}
       </div>
    </div>
  );
};

export default ResultScreen;
