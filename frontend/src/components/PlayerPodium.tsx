import React from 'react';
import { Box, Typography } from '@mui/material';

interface Player {
  id: number;
  player_name: string;
  elo: number;
  total_matches: number;
  recently_pantsed: boolean;
}

interface PlayerPodiumProps {
  players: Player[];
  showPlayerNumbers?: boolean;
}

const PlayerPodium: React.FC<PlayerPodiumProps> = ({ players, showPlayerNumbers }) => {
  return (
    <Box sx={{ flex: 1 }}>
      <h2>Shed Podium</h2>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 2,
        mb: 4,
        minHeight: '200px'
      }}>
        {[...players]
          .filter(player => player.total_matches >= 3)
          .sort((a, b) => b.elo - a.elo)
          .slice(0, 3)
          .map((player, index) => (
          <Box
            key={player.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              order: { xs: 0, md: index === 1 ? 0 : index === 0 ? 1 : 2 },
              flex: { xs: 1, md: 'none' },
              width: { xs: '100%', md: '200px' },
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: index === 0 ? '120px' : index === 1 ? '80px' : '40px',
                backgroundColor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32',
                borderRadius: '8px 8px 0 0',
                zIndex: 0
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{
                position: 'relative',
                zIndex: 1,
                mb: 1,
                fontWeight: 'bold',
                color: 'text.primary'
              }}
            >
              {showPlayerNumbers ? `#${player.id} - ` : ''}{player.player_name}{player.recently_pantsed ? ' 👖' : ''}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                position: 'relative',
                zIndex: 1,
                color: 'text.secondary',
                fontWeight: 'bold'
              }}
            >
              ELO: {player.elo} 
              <br />
              Games: {player.total_matches}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                position: 'relative',
                zIndex: 1,
                color: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32',
                fontWeight: 'bold',
                mt: 1
              }}
            >
              #{index + 1}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ 
        mt: 4, 
        display: "flex", 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'center',
        gap: 3
      }}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Ranked Players</Typography>
          {[...players]
            .filter(player => player.total_matches >= 3)
            .sort((a, b) => b.elo - a.elo)
            .slice(3)
            .map((player, index) => (
            <Typography key={player.id} sx={{ mb: 1 }}>
              #{index + 4}. {showPlayerNumbers ? `#${player.id} - ` : ''}{player.player_name}{player.recently_pantsed ? ' 👖' : ''} (ELO: {player.elo}) (Games: {player.total_matches})
            </Typography>
          ))}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Qualifying</Typography>
          {[...players]
            .filter(player => player.total_matches < 3)
            .sort((a, b) => b.elo - a.elo)
            .map((player) => (
            <Typography key={player.id} sx={{ mb: 1 }}>
              {showPlayerNumbers ? `#${player.id} - ` : ''}{player.player_name}{player.recently_pantsed ? ' 👖' : ''} (ELO: {player.elo}) (Games: {player.total_matches})
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PlayerPodium; 