import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Select, MenuItem, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface PlayerStreakLongest {
  player_id: number;
  player_name: string;
  longest_streak: number;
  longest_streak_elo_change: number;
  streak_type: string;
}

interface MostMatchesInDay {
  player_id: number;
  player_name: string;
  date: string;
  matches_played: number;
}

interface TotalMatchStats {
  total_matches: number;
  money_saved: number;
  time_wasted: number;
}

interface PlayerStatsProps {
  playerStreakLongest: PlayerStreakLongest[];
  mostMatchesInDay: MostMatchesInDay;
  totalMatchStats: TotalMatchStats;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({
  playerStreakLongest,
  mostMatchesInDay,
  totalMatchStats
}) => {
  return (
    <>
      <h2>Player Statistics</h2>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>View Player Stats</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Winning Streak Record box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            {[...playerStreakLongest]
              .filter(streak => streak.streak_type === "win")
              .sort((a, b) => b.longest_streak - a.longest_streak)
              .slice(0, 1)
              .map((playerStreakLongest) => (
              <Box
                key={playerStreakLongest.player_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1">
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Longest Winning Streak
                    </Typography>
                    <Typography component="span">{playerStreakLongest.player_name} with </Typography>
                    <Typography component="span" sx={{ color: 'success.main' }}>
                      {playerStreakLongest.longest_streak} wins (+{playerStreakLongest.longest_streak_elo_change})
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
          {/* Losing Streak Record box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            {[...playerStreakLongest]
              .filter(streak => streak.streak_type === "loss")
              .sort((a, b) => b.longest_streak - a.longest_streak)
              .slice(0, 1)
              .map((playerStreakLongest) => (
              <Box
                key={playerStreakLongest.player_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1">
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Longest Losing Streak
                    </Typography>
                    <Typography component="span">{playerStreakLongest.player_name} with </Typography>
                    <Typography component="span" sx={{ color: 'error.main' }}>
                      {playerStreakLongest.longest_streak} losses ({playerStreakLongest.longest_streak_elo_change})
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
          {/* Most Matches in a Day box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1,
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Most Matches in a Day
                  </Typography>
                  <Typography component="span">{mostMatchesInDay.player_name} played </Typography>
                  <Typography component="span" sx={{ color: 'info.main' }}>
                    {mostMatchesInDay.matches_played} matches
                  </Typography>
                  <Typography component="span"> on {new Date(mostMatchesInDay.date).toLocaleDateString()}</Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
          {/* Total Matches box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1,
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Total Matches Played
                  </Typography>
                  <Typography component="span" sx={{ color: 'info.main' }}>
                    #{totalMatchStats.total_matches}
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
          {/* Money Saved box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1,
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Money Saved at the pub
                  </Typography>
                  <Typography component="span" sx={{ color: 'success.main' }}>
                    ${totalMatchStats.money_saved}
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
          {/* Time wasted box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1,
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Time wasted in the shed
                  </Typography>
                  <Typography component="span" sx={{ color: 'success.main' }}>
                    {totalMatchStats.time_wasted / 60} hours
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default PlayerStats; 