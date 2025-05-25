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

export const checkAssassination = (data: MatchData, players: Player[]): SpecialMatchResult | null => {
  // Sort players by ELO in descending order
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);
  const highestEloPlayer = sortedPlayers[0];

  // Check if any of the losers is the highest ELO player
  const isAssassination = data.losers.some(loser => loser.id === highestEloPlayer.id);

  if (isAssassination) {
    return {
      message: "💥🎯🥇 !HEADSHOT! 🥇🎯💥",
      color: "#e30202"
    };
  }
  return null;
};


export const checkMassiveGain = (data: MatchData): SpecialMatchResult | null => {
  const massiveGain = data.winners.some(winner => winner.elo_change >= 20);
  if (massiveGain) {
    return {
      message: "🎉 !HUGE WIN! 🎉",
      color: "#02d90b"
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

export const checkSpecialMatchResult = (data: MatchData, players: Player[]): SpecialMatchResult[] => {
  const checks = [
    
    checkAssassination(data,players)
  ];

  return checks.filter((result): result is SpecialMatchResult => result !== null);
}; 