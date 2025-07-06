import React from 'react';
import { Box, Typography } from '@mui/material';

interface Player {
  id: number;
  player_name: string;
  elo: number;
  total_matches: number;
  recently_pantsed: boolean;
  matches_in_season: number;
}

interface PlayerPodiumProps {
  players: Player[];
  showPlayerNumbers?: boolean;
}

const PlayerPodium: React.FC<PlayerPodiumProps> = ({ players, showPlayerNumbers }) => {
  return (
    <Box sx={{ flex: 1 }}>
      <h2>Shed Podium</h2>
      {(() => {
        const rankedPlayers = [...players].filter(player => player.matches_in_season >= 3);
        
        if (rankedPlayers.length === 0) {
          return (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              mb: 4
            }}>
              <Box>
                <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                  No ranked players yet, play some games to get on the podium!
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>Qualifying Players</Typography>
                {[...players]
                  .filter(player => player.matches_in_season < 3)
                  .sort((a, b) => b.elo - a.elo)
                  .map((player) => (
                  <Typography key={player.id} sx={{ mb: 1 }}>
                    {showPlayerNumbers ? `#${player.id} - ` : ''}{player.player_name}{player.recently_pantsed ? ' 👖' : ''} (ELO: {player.elo}) (Games: {player.matches_in_season})
                  </Typography>
                ))}
              </Box>
            </Box>
          );
        }
        
        return (
          <div>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', md: 'row' },
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: { xs: 1, md: 2 },
              mb: { xs: 2, md: 4 },
              minHeight: { xs: '100px', md: '200px' }
            }}>
              {rankedPlayers
                .sort((a, b) => b.elo - a.elo)
                .slice(0, 3)
                .map((player, index) => (
                <Box
                  key={player.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    order: index === 1 ? 0 : index === 0 ? 1 : 2,
                    flex: { xs: 1, md: 'none' },
                    width: { xs: '90px', md: '200px' },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: index === 0 ? { xs: '60px', md: '120px' } : index === 1 ? { xs: '40px', md: '80px' } : { xs: '25px', md: '40px' },
                      backgroundColor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32',
                      borderRadius: '8px 8px 0 0',
                      zIndex: 0
                    },
                    mx: { xs: 0.5, md: 0 }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      mb: { xs: 0.5, md: 1 },
                      fontWeight: 'bold',
                      color: 'text.primary',
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      textAlign: 'center'
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
                      fontWeight: 'bold',
                      fontSize: { xs: '0.85rem', md: '1rem' },
                      textAlign: 'center'
                    }}
                  >
                    ELO: {player.elo} 
                    <br />
                    Games: {player.matches_in_season}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32',
                      fontWeight: 'bold',
                      mt: { xs: 0.5, md: 1 },
                      fontSize: { xs: '1.5rem', md: '2rem' }
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
                  .filter(player => player.matches_in_season >= 3)
                  .sort((a, b) => b.elo - a.elo)
                  .slice(3)
                  .map((player, index) => (
                  <Typography key={player.id} sx={{ mb: 1 }}>
                    #{index + 4}. {showPlayerNumbers ? `#${player.id} - ` : ''}{player.player_name}{player.recently_pantsed ? ' 👖' : ''} (ELO: {player.elo}) (Games: {player.matches_in_season})
                  </Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Qualifying</Typography>
                {[...players]
                  .filter(player => player.matches_in_season < 3)
                  .sort((a, b) => b.elo - a.elo)
                  .map((player) => (
                  <Typography key={player.id} sx={{ mb: 1 }}>
                    {showPlayerNumbers ? `#${player.id} - ` : ''}{player.player_name}{player.recently_pantsed ? ' 👖' : ''} (ELO: {player.elo}) (Games: {player.matches_in_season})
                  </Typography>
                ))}
              </Box>
            </Box>
          </div>
        );
      })()}
    </Box>
  );
};

export default PlayerPodium; 