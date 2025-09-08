import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Result, PathHistoryItem, BranchingQuestion, RefinementQuestion } from './types';
import { getScenarioJson, getBranchingChoices, getRefinementChoices } from './services/geminiService';
import StartScreen from './components/StartScreen';
import ChoiceNode from './components/ChoiceNode';
import ResultScreen from './components/ResultBud';
import LoadingScreen from './components/LoadingScreen';
import RadialChoiceScreen from './components/RadialChoiceScreen';
import TreeVisualization from './components/TreeVisualization';
import SettingsMenu from './components/SettingsMenu';
import BuddingScreen from './components/BuddingScreen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [pathChoices, setPathChoices] = useState<PathHistoryItem[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  
  const [branchingQuestions, setBranchingQuestions] = useState<BranchingQuestion[] | null>(null);
  const [refinementQuestions, setRefinementQuestions] = useState<RefinementQuestion[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBlooming, setIsBlooming] = useState<boolean>(false);
  
  const [result, setResult] = useState<Result | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isErrorResult, setIsErrorResult] = useState<boolean>(false);

  const fetchFinalScenario = useCallback(async (finalPath: PathHistoryItem[]) => {
    setGameState(GameState.Loading);
    setIsLoading(true);
    setIsErrorResult(false);
    try {
      const apiResult = await getScenarioJson(finalPath);
      setResult(apiResult);
      setGameState(GameState.Result);
      setIsBlooming(true);
    } catch (error: any) {
      console.error("Error fetching scenario:", error);
      setIsErrorResult(true);
      setResult({
        summary: "An error occurred while forging the final world scenario.",
        scenarioJson: JSON.stringify({ error: "Failed to generate scenario.", details: error.message }, null, 2),
      });
      setGameState(GameState.Result);
      setIsBlooming(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (gameState === GameState.Choosing && !branchingQuestions && pathChoices.length === 0) {
      const fetchBranchingData = async () => {
        setIsLoading(true);
        setApiError(null);
        try {
          const choices = await getBranchingChoices();
          setBranchingQuestions(choices);
        } catch (error: any) {
           console.error("Error fetching branching choices:", error);
           setApiError(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBranchingData();
    }
  }, [gameState, branchingQuestions, pathChoices]);

  const handleChoice = (choice: string, question: string) => {
     if (isLoading) return;

     const newPath = [...pathChoices, { question, choice }];
     setPathChoices(newPath);
     const newLevel = currentLevel + 1;
     setCurrentLevel(newLevel);

     if (newLevel === 8) {
        const fetchRefinementData = async () => {
            setIsLoading(true);
            setApiError(null);
            try {
                const choices = await getRefinementChoices(newPath);
                setRefinementQuestions(choices);
            } catch (error: any) {
                console.error("Error fetching refinement choices:", error);
                setApiError(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRefinementData();
     } else if (newLevel === 10) {
        setGameState(GameState.Budding);
     }
  };

  const restart = () => {
    setGameState(GameState.Start);
    setPathChoices([]);
    setCurrentLevel(0);
    setResult(null);
    setBranchingQuestions(null);
    setRefinementQuestions(null);
    setIsLoading(false);
    setIsBlooming(false);
    setIsErrorResult(false);
    setApiError(null);
  };
  
  const handleStart = (budJson?: string) => {
    if (budJson) {
      try {
        const parsedBud = JSON.parse(budJson);
        if (Array.isArray(parsedBud) && parsedBud.length === 10) {
           setPathChoices(parsedBud);
           setCurrentLevel(10);
           setGameState(GameState.Budding);
           return;
        }
        alert("Invalid bud data. Starting a new journey.");
      } catch (error) {
        alert("Could not parse bud data. Starting a new journey.");
      }
    }
    setGameState(GameState.Choosing);
  };

  const handleCraftWorld = () => {
    fetchFinalScenario(pathChoices);
  }

  const renderContent = () => {
    if (isLoading && (gameState === GameState.Choosing || gameState === GameState.Loading)) {
      return <LoadingScreen />;
    }

     if (apiError) {
        return (
            <div className="text-center animate-fade-in-up">
                <div className="mb-6 p-4 border border-red-500 bg-red-900/50 rounded-lg text-red-200 max-w-2xl w-full">
                    <h3 className="font-bold text-xl mb-2">A Critical Error Occurred</h3>
                    <p className="text-sm font-mono whitespace-pre-wrap mb-4">{apiError}</p>
                </div>
                <button
                    onClick={restart}
                    className="px-8 py-3 bg-amber-500 text-gray-900 font-bold rounded-full uppercase tracking-widest hover:bg-amber-400"
                >
                    Restart Journey
                </button>
            </div>
        );
    }

    switch (gameState) {
      case GameState.Start:
        return <StartScreen onStart={handleStart} onOpenSettings={() => setIsSettingsOpen(true)} />;
      
      case GameState.Choosing:
        if (currentLevel < 8 && branchingQuestions) {
          const currentQuestionSet = branchingQuestions[currentLevel];
          return (
            <RadialChoiceScreen
              level={currentLevel}
              questionTemplate={currentQuestionSet.questionTemplate}
              options={currentQuestionSet.options}
              onChoice={handleChoice}
            />
          );
        }
        if (currentLevel >= 8 && refinementQuestions) {
            const currentQuestionSet = refinementQuestions[currentLevel - 8];
            return (
                <ChoiceNode
                    level={currentLevel}
                    questionTemplate={currentQuestionSet.questionTemplate}
                    options={currentQuestionSet.options}
                    onChoice={handleChoice}
                    pathHistory={pathChoices.map(p => p.choice)}
                />
            );
        }
        return <LoadingScreen />; // Fallback while waiting for state update

      case GameState.Budding:
        return <BuddingScreen pathHistory={pathChoices} onCraftWorld={handleCraftWorld} />;

      case GameState.Result:
        return <ResultScreen result={result} onRestart={restart} isError={isErrorResult} onRetry={() => fetchFinalScenario(pathChoices)} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-amber-200 font-mono flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <TreeVisualization branchLevel={currentLevel} isBlooming={isBlooming} />
      <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <div className="absolute inset-0 bg-grid-amber-500/[0.05] [mask-image:linear-gradient(to_bottom,white_5%,transparent_95%)]"></div>
      <div className="z-10 w-full flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
