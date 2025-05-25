import React from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, ExpandMoreIcon } from '@mui/material';
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

const PlayerKDs: React.FC<PlayerKDProps> = ({ playerKd }) => {
  return (
    <Box sx={{ flex: 1 }}>
      <h2>Current K/D Ratios</h2>
      <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
        {[...playerKd]
          .slice(0, 3)
          .map((kdplayer) => (
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
                <Typography component="span" variant="body1" sx={{ fontWeight: 'bold' }}>
                  {kdplayer.player_name}
                </Typography>
                : {kdplayer.kd} (
                <Typography component="span" sx={{ color: 'success.main' }}>
                  {kdplayer.wins}
                </Typography>
                /
                <Typography component="span" sx={{ color: 'error.main' }}>
                  {kdplayer.losses}
                </Typography>
                )
              </Typography>
            </Box>
          </Box>
        ))}
        {[...playerKd]
          .slice(3)
          .map((kdplayer) => (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Show more</Typography>
            </AccordionSummary>
            <AccordionDetails>
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
                    <Typography component="span" variant="body1" sx={{ fontWeight: 'bold' }}>
                      {kdplayer.player_name}
                    </Typography>
                    : {kdplayer.kd} (
                    <Typography component="span" sx={{ color: 'success.main' }}>
                      {kdplayer.wins}
                    </Typography>
                    /
                    <Typography component="span" sx={{ color: 'error.main' }}>
                      {kdplayer.losses}
                    </Typography>
                    )
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
};

export default PlayerKDs; 