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

interface PlayerStatsProps {
  playerStreakLongest: PlayerStreakLongest[];
}

const PlayerStats: React.FC<PlayerStatsProps> = ({
  playerStreakLongest
  }) => {
  return (
    <>
      <h2>Player Statistics</h2>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>View Player Stats</Typography>
        </AccordionSummary>
        <AccordionDetails>
          // Longest winning streak
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
          // Longest losing streak
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
                      {playerStreakLongest.longest_streak} wins (+{playerStreakLongest.longest_streak_elo_change})
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default PlayerStats; 