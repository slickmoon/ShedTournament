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

export const checkLowestLostAgain = (data: MatchData, players: Player[]): SpecialMatchResult | null => {
  // Sort players by ELO in ascending order and filter for those with 3+ matches
  const eligiblePlayers = players.filter(player => player.total_matches >= 3);
  const sortedPlayers = [...eligiblePlayers].sort((a, b) => a.elo - b.elo);
  const lowestEloPlayer = sortedPlayers[0];

  // Check if any of the losers is the highest ELO player
  const isLowestLost = lowestEloPlayer && data.losers.some(loser => loser.id === lowestEloPlayer.id);

  if (isLowestLost) {
    return {
      message: "😭 Stop, stop, they're already dead! 😭",
      color: "#02d4db"
    };
  }
  return null;
};

export const checkSpecialMatchResult = (data: MatchData, players: Player[]): SpecialMatchResult[] => {
  const checks = [
    checkAssassination(data,players),
    checkMassiveGain(data),
    checkLowestLostAgain(data,players)
  ];

  return checks.filter((result): result is SpecialMatchResult => result !== null);
}; 