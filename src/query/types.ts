export interface GetUserModelParams {
  limbUserId: string;
}

export interface UserModel {
  senecaUserId: string;
  phase: 1 | 2 | 3;
  agtOrientation: number;
  agtConfidence: number;
  baselineDirective: string | null;
  totalSessions: number;
  language: "ko" | "en";
  activeMemories: Array<{
    category: string;
    observation: string;
    confidence: number;
  }>;
}

export interface ExportUserDataParams {
  limbUserId: string;
  format: "json" | "ndjson";
}

export interface DeleteUserDataParams {
  limbUserId: string;
  confirmationToken: string;
}
