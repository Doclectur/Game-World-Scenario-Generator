import React from 'react';

interface ChoiceNodeProps {
  level: number;
  questionTemplate: string;
  options: string[];
  onChoice: (choice: string, question: string) => void;
  pathHistory: string[];
  errorDetails?: string;
}

const PathOption: React.FC<{ text: string; onSelect: () => void; }> = ({ text, onSelect }) => {
  return (
    <div 
      className="relative group cursor-pointer w-full"
      onClick={onSelect}
      aria-label={`Choose option: ${text}`}
      role="button"
    >
      <div className="absolute -inset-0.5 rounded-lg transition-all duration-500 bg-gradient-to-r from-amber-600 to-yellow-500 opacity-50 group-hover:opacity-100 blur"></div>
      <div className="relative bg-stone-800 border border-stone-700 rounded-lg p-4 transition-all duration-200 group-hover:bg-stone-700">
        <p className="text-center font-semibold text-lg text-gray-100 transition-colors duration-200 group-hover:text-white">
          {text}
        </p>
      </div>
    </div>
  );
};

const ChoiceNode: React.FC<ChoiceNodeProps> = ({ level, questionTemplate, options, onChoice, pathHistory, errorDetails }) => {
  
  if (!options || options.length === 0) {
      return null;
  }

  return (
    <div className="flex flex-col items-center w-full animate-fade-in-up">
      {errorDetails && (
        <div className="mb-6 p-4 border border-red-500 bg-red-900/50 rounded-lg text-red-200 text-center max-w-2xl w-full">
          <h3 className="font-bold mb-2">Failed to Forge Path</h3>
          <p className="text-sm font-mono whitespace-pre-wrap">{errorDetails}</p>
        </div>
      )}

      <div className="mb-8 text-center">
        <p className="text-amber-400 uppercase tracking-widest">Branch {level + 1} / 10</p>
        <h2 className="text-3xl font-bold text-white mt-2">
            {questionTemplate}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {options.map((option) => (
            <PathOption 
                key={option}
                text={option} 
                onSelect={() => onChoice(option, questionTemplate)}
            />
          ))}
      </div>

       {pathHistory.length > 0 && (
        <div className="mt-12 p-4 border border-amber-900 rounded-lg bg-stone-800/30 w-full max-w-2xl">
          <h3 className="text-sm uppercase text-amber-500 tracking-widest mb-2">World Blueprint:</h3>
          <p className="text-amber-200">{pathHistory.join(' → ')}</p>
        </div>
      )}
    </div>
  );
};

export default ChoiceNode;
