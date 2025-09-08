import React, { useState, useEffect } from 'react';

const loadingMessages = [
    "Forging continents...",
    "Consulting the world-spirit...",
    "Defining the laws of reality...",
    "Dreaming up societies...",
    "Awaiting the final creation..."
];

const LoadingScreen: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center animate-fade-in p-8 bg-transparent">
            <div className="px-6 py-3 bg-stone-900/50 rounded-lg backdrop-blur-sm">
                <p className="text-xl text-amber-200 transition-opacity duration-500 [text-shadow:0_0_8px_rgba(252,165,3,0.7)]">
                    {loadingMessages[messageIndex]}
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;