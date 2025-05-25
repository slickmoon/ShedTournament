import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Select, MenuItem, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


interface PlayerStreakLongest {
  player_id: number;
  player_name: string;
  longest_streak: number;
  longest_streak_elo_change: number;
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
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            {playerStreakLongest.map((playerStreakLongest) => (
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
                    <Typography component="span" variant="body1" sx={{ fontWeight: 'bold' }}>
                      Longest Streak held by: {playerStreakLongest.player_name}
                    </Typography>
                    <Typography component="span" sx={{ color: 'success.main' }}>
                    : {playerStreakLongest.longest_streak} (+{playerStreakLongest.longest_streak_elo_change})
                    </Typography>
                    )
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