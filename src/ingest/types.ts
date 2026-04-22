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

export interface ObserveParams {
  limbUserId: string;
  observations: Array<{
    observation: string;
    category: ObservationCategory;
    confidence: number;
    signalType?: SignalType;
    sessionRef?: string;
  }>;
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
