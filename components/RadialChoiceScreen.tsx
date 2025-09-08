import React from 'react';
import { ChoiceOption } from '../types';

interface RadialChoiceScreenProps {
  level: number;
  questionTemplate: string;
  options: ChoiceOption[];
  onChoice: (choice: string, question: string) => void;
}

const RadialChoiceScreen: React.FC<RadialChoiceScreenProps> = ({ level, questionTemplate, options, onChoice }) => {
  const numOptions = options.length;
  const radius = window.innerWidth < 768 ? 160 : 260; 
  const containerSize = radius * 2 + 150;

  return (
    <div className="flex flex-col items-center w-full animate-fade-in-up" style={{ minHeight: `${containerSize}px` }}>

      <div className="mb-8 text-center">
        <p className="text-amber-400 uppercase tracking-widest">Branch {level + 1} / 10</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
          {questionTemplate.replace('{}', '...')}
        </h2>
      </div>

      <div className="relative" style={{ width: `${containerSize}px`, height: `${containerSize}px` }}>
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${containerSize} ${containerSize}`}>
          {/* Spokes */}
          {options.map((_, index) => {
            const angle = (index / numOptions) * 2 * Math.PI - Math.PI / 2;
            const center = containerSize / 2;
            const x2 = center + (radius - 60) * Math.cos(angle);
            const y2 = center + (radius - 60) * Math.sin(angle);
            return (
              <line
                key={index}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="rgba(252, 165, 3, 0.2)"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Central Hub */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 rounded-full bg-stone-900 border-2 border-amber-600 flex items-center justify-center text-center shadow-lg shadow-amber-900/50"
        >
          <span className="text-amber-400 font-bold uppercase tracking-widest text-sm md:text-base">
            Choose a Path
          </span>
        </div>

        {/* Buttons at the end of spokes */}
        {options.map((option, index) => {
          const angle = (index / numOptions) * 2 * Math.PI - Math.PI / 2;
          const center = containerSize / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);

          return (
            <div
              key={option.positive}
              className="absolute flex flex-col items-center w-40 md:w-48 text-center"
              style={{
                top: `${y}px`,
                left: `${x}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex flex-col space-y-2 w-full">
                <button
                  onClick={() => onChoice(option.positive, questionTemplate)}
                  className="px-2 py-2 bg-amber-800/50 text-amber-100 border border-amber-700 rounded-md text-xs md:text-sm hover:bg-amber-700 hover:text-white hover:scale-105 transform transition-all duration-200"
                >
                  {option.positive}
                </button>
                <button
                  onClick={() => onChoice(option.negative, questionTemplate)}
                  className="px-2 py-2 bg-orange-800/50 text-orange-200 border border-orange-700 rounded-md text-xs md:text-sm hover:bg-orange-700 hover:text-white hover:scale-105 transform transition-all duration-200"
                >
                  {option.negative}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadialChoiceScreen;
