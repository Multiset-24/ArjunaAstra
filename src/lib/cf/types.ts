/** Compact problem row: [contestId, index, name, rating, solvedCount, tags] */
export type CfRow = [number, string, string, number, number, string[]];

export interface Problemset {
  source: "live" | "snapshot";
  fetchedAt: string;
  problems: CfRow[];
}

export interface LadderRung {
  rating: number;
  problems: CfRow[];
}

export interface Ladder {
  source: "live" | "snapshot";
  fetchedAt: string;
  rungs: LadderRung[];
  tags: string[];
}

export interface CfSyncResult {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  solved: string[];
  tried: string[];
}
