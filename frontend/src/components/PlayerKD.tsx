import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

interface PlayerKD {
  player_id: number;
  player_name: string;
  wins: number;
  losses: number;
  kd: number;
}

interface PlayerKDProps {
  playerKd: PlayerKD[];
}

const PlayerStreaks: React.FC<PlayerKDProps> = ({ playerKd }) => {
  return (
    <Box sx={{ flex: 1 }}>
      <h2>Current K/D Ratios</h2>
      <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
        {playerKd.slice(3).map((kdplayer) => (
          <Box
            key={kdplayer.player_id}
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
              {kdplayer.player_name}: {kdplayer.kd} (W: {kdplayer.wins}/ L: {kdplayer.losses})
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default PlayerStreaks; 