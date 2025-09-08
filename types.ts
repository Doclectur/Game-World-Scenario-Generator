export enum GameState {
  Start,
  Choosing,
  Loading,
  Budding,
  Result,
}

export interface Result {
  summary: string;
  scenarioJson: string;
}

export interface ChoiceOption {
  positive: string;
  negative: string;
}

export interface BranchingQuestion {
  questionTemplate: string;
  options: ChoiceOption[];
  errorDetails?: string;
}

export interface RefinementQuestion {
  questionTemplate: string;
  options: string[];
  errorDetails?: string;
}


export interface PathHistoryItem {
  question: string;
  choice: string;
}
