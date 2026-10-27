import React from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

interface PlayerStreak {
  player_id: number;
  player_name: string;
  current_streak: number;
  elo_change: number;
}

interface PlayerStreaksProps {
  playerStreaks: PlayerStreak[];
}

const PlayerStreaks: React.FC<PlayerStreaksProps> = ({ playerStreaks }) => {
  return (
    <Box sx={{ flex: 1 }}>
      <h2>Current Winning Streaks</h2>
      <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
        {playerStreaks.slice(0, 3).map((streak, index) => (
          <Box
            key={streak.player_id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mb: 2,
              borderRadius: 1,
              bgcolor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 
                      index === 1 ? 'rgba(192, 192, 192, 0.1)' : 
                      'rgba(205, 127, 50, 0.1)',
              border: '1px solid',
              borderColor: index === 0 ? 'gold' : 
                          index === 1 ? 'silver' : 
                          '#cd7f32'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalFireDepartmentIcon 
                sx={{ 
                  color: index === 0 ? 'gold' : 
                        index === 1 ? 'silver' : 
                        '#cd7f32',
                  fontSize: 24
                }} 
              />
              <Typography variant="h6" sx={{ color: index === 0 ? 'gold' : 
                                                      index === 1 ? 'silver' : 
                                                      '#cd7f32' }}>
                {streak.current_streak}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {streak.player_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ELO Earned: (+{streak.elo_change})
              </Typography>
            </Box>
          </Box>
        ))}
        {playerStreaks.slice(3).map((streak) => (
          <Box
            key={streak.player_id}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalFireDepartmentIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body1" color="text.secondary">
                {streak.current_streak}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1">
                {streak.player_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ELO Earned: (+{streak.elo_change})
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default PlayerStreaks; 