import { Box, Typography } from '@mui/material';
import { Player } from '../types/Player';

interface MatchPlayer {
  id: number;
  name: string;
  new_elo: number;
  elo_change: number;
}

interface MatchData {
  winners: MatchPlayer[];
  losers: MatchPlayer[];
}

interface SpecialMatchResult {
  message: string;
  color: string;
}

export const checkPerfectWin = (data: MatchData): SpecialMatchResult | null => {
  const perfectWin = data.winners.every(winner => winner.elo_change > 0);
  if (perfectWin) {
    return {
      message: "Perfect Victory!",
      color: "#4caf50" // success.main
    };
  }
  return null;
};

export const checkMassiveGain = (data: MatchData): SpecialMatchResult | null => {
  const massiveGain = data.winners.some(winner => winner.elo_change >= 20);
  if (massiveGain) {
    return {
      message: "Massive ELO Gain!",
      color: "#4caf50" // success.main
    };
  }
  return null;
};

export const checkUpset = (data: MatchData): SpecialMatchResult | null => {
  const upset = data.winners.some(winner => 
    data.losers.some(loser => 
      winner.new_elo - winner.elo_change < loser.new_elo - loser.elo_change
    )
  );
  if (upset) {
    return {
      message: "Upset Alert!",
      color: "#ff9800" // warning.main
    };
  }
  return null;
};

export const checkFirstMatch = (data: MatchData, players: Player[]): SpecialMatchResult | null => {
  const firstMatch = data.winners.some(winner => {
    const player = players.find(p => p.id === winner.id);
    return player?.total_matches === 0;
  }) || data.losers.some(loser => {
    const player = players.find(p => p.id === loser.id);
    return player?.total_matches === 0;
  });

  if (firstMatch) {
    return {
      message: "First Match!",
      color: "#2196f3" // info.main
    };
  }
  return null;
};

export const checkSpecialMatchResult = (data: MatchData, players: Player[]): SpecialMatchResult[] => {
  const checks = [
    checkPerfectWin(data),
    checkMassiveGain(data),
    checkUpset(data),
    checkFirstMatch(data, players)
  ];

  return checks.filter((result): result is SpecialMatchResult => result !== null);
}; 