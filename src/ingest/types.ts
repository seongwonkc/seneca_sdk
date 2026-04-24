export type ObservationCategory =
  | "behavioral"
  | "cognitive"
  | "emotional"
  | "preference"
  | "performance";

export type SignalType =
  | "test_behavior"
  | "engagement"
  | "error_pattern"
  | "breakthrough"
  | "avoidance";

export interface QuestionData {
  questionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  wasFlagged: boolean;
  numberOfChanges: number;
  positionInSession: number;
  skippedFirstTime: boolean;
}

export interface ObserveObservation {
  observation: string;
  category: ObservationCategory;
  confidence: number;
  signalType?: SignalType;
  sessionRef?: string;
  questionData?: QuestionData;
}

export interface ObserveParams {
  limbUserId: string;
  observations: ObserveObservation[];
}

export interface ObserveResult {
  senecaUserId: string;
  memoryIds: string[];
}

export interface SessionSignalParams {
  limbUserId: string;
  session: {
    sessionRef: string;
    startedAt: string;
    endedAt: string;
    durationMinutes: number;
    engagementScore: number;
    topics: string[];
    performanceDelta: number;
    anxietySignal?: number;
    context: string;
    totalQuestionsAttempted?: number;
    totalCorrect?: number;
    sectionsCompleted?: string[];
    completedFullSession?: boolean;
    firstQuartileAvgSeconds?: number;
    lastQuartileAvgSeconds?: number;
  };
}

export interface LinkUserParams {
  senecaLinkToken: string;
  limbUserId: string;
}

export interface LinkUserResult {
  senecaUserId: string;
  linkedAt: string;
}
