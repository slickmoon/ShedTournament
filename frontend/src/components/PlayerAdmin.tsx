import React, { useState } from 'react';
import { Box, Button, TextField, Select, MenuItem, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Player {
  id: number;
  player_name: string;
}

interface PlayerAdminProps {
  players: Player[];
  onAddPlayer: (playerName: string) => void;
  onDeletePlayer: (playerId: number, access_password: string) => void;
  onUpdatePlayer: (playerId: number, playerName: string, access_password: string) => void;
  playerAdminMessage: string | React.ReactNode;
}

const PlayerAdmin: React.FC<PlayerAdminProps> = ({
  players,
  onAddPlayer,
  onDeletePlayer,
  onUpdatePlayer,
  playerAdminMessage
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedUpdatePlayer, setSelectedUpdatePlayer] = useState<string>('');
  const [selectedPlayerUpdateName, setSelectedPlayerUpdateName] = useState<string>('');
  const [accessPassword, setAccessPassword] = useState<string>('');

  return (
    <>
      <h2>Player Administration</h2>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Add/Delete Players</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {playerAdminMessage && (
            <Typography variant="h6" sx={{ mt: 2 }}>
              {playerAdminMessage}
            </Typography>
          )}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'center', 
            gap: 4, 
            mb: 3,
            '& > *': {
              mb: { xs: 4, md: 0 }
            }
          }}>
            <Box sx={{ textAlign: 'center', width: { xs: '100%', md: 'auto' } }}>
              <h2>Add Player</h2>
              <TextField id="player-name-input" label="Player Name" variant="outlined" InputLabelProps={{ shrink: true }} fullWidth />
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained"
                  onClick={() => {
                    const playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
                    if (playerNameInput.value) {
                      onAddPlayer(playerNameInput.value);
                    }
                  }}
                >
                  Add player
                </Button>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center', width: { xs: '100%', md: 'auto' } }}>
              <h2>Delete Player</h2>
              <Select
                id="player-delete-input"
                label="Player Name"
                variant="outlined"
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 200 } }}
                fullWidth
              >
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.player_name}>
                    {player.player_name}
                  </MenuItem>
                ))}
              </Select>
              <Box sx={{ mt: 2 }}>
                <TextField
                  id="delete-access-password"
                  label="Admin Password"
                  type="password"
                  variant="outlined"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="error" 
                  onClick={() => {
                    const player = players.find(p => p.player_name.toLowerCase() === selectedPlayer.toLowerCase());
                    if (player) {
                      onDeletePlayer(player.id, accessPassword);
                      setAccessPassword('');
                    }
                  }}
                >
                  Delete player
                </Button>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center', width: { xs: '100%', md: 'auto' } }}>
              <h2>Manually Update Player details</h2>
              <Select
                id="player-update-input"
                label="Player Name"
                variant="outlined"
                value={selectedUpdatePlayer}
                onChange={(e) => setSelectedUpdatePlayer(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 200 } }}
                fullWidth
              >
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.id} onClick={() => {
                    const playerNameInput = document.getElementById('player-name-update-input') as HTMLInputElement;
                    playerNameInput.value = player.player_name;
                    setSelectedPlayerUpdateName(player.player_name);
                  }}>
                    {player.player_name}
                  </MenuItem>
                ))}
              </Select>
              <TextField 
                id="player-id-read-only" 
                label="Player ID" 
                variant="outlined" 
                value={selectedUpdatePlayer} 
                disabled 
                fullWidth
                sx={{ mt: 2 }}
              />
              <TextField 
                id="player-name-update-input" 
                label="New Name" 
                variant="outlined" 
                InputLabelProps={{ shrink: true }} 
                fullWidth
                sx={{ mt: 2 }}
              />
              <Box sx={{ mt: 2 }}>
                <TextField
                  id="update-access-password"
                  label="Admin Password"
                  type="password"
                  variant="outlined"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    const playerNameInput = document.getElementById('player-name-update-input') as HTMLInputElement;
                    const player = players.find(p => p.id == parseInt(selectedUpdatePlayer));
                    if (player) {
                      onUpdatePlayer(player.id, playerNameInput.value, accessPassword);
                      setSelectedUpdatePlayer('');
                      playerNameInput.value = '';
                      setAccessPassword('');
                    }
                  }}
                >
                  Update player
                </Button>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default PlayerAdmin; 