import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, Button, Typography, Box, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import theme from './theme.ts';
import { API_BASE_URL } from './config.ts';
import { Login } from './components/Login.tsx';
import { randomTexts } from './data/shed-quotes.ts';
import './App.css';

const queryClient = new QueryClient();

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('shed-tournament-token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

interface Player {
  id: number;
  player_name: string;
  elo: number;
}

interface AuditLog {
  id: number;
  log: string;
  timestamp: string;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | React.ReactNode>('');
  const [updatePlayerMessage, setUpdatePlayerMessage] = useState<string | React.ReactNode>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedUpdatePlayer, setSelectedUpdatePlayer] = useState<string>('');
  const [selectedPlayerUpdateName, setSelectedPlayerUpdateName] = useState<string>('');
  const [selectedPlayerUpdateElo, setSelectedPlayerUpdateElo] = useState<number>(0);
  const [auditlog, setAuditLog] = useState<AuditLog[]>([]);
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [matchError, setMatchError] = useState<string>('');
  const [winner, setWinner] = useState<string>('');
  const [loser, setLoser] = useState<string>('');
  const [randomText, setRandomText] = useState<string>('');
  const [isDoubles, setIsDoubles] = useState(false);
  const [winner2, setWinner2] = useState<string>('');
  const [loser2, setLoser2] = useState<string>('');

  // Load initial data and check token
  useEffect(() => {
    const storedToken = localStorage.getItem('shed-tournament-token');
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
    // Set random text on initial load
    setRandomText(randomTexts[Math.floor(Math.random() * randomTexts.length)]);
  }, []);

  // Load players and audit log when token is available
  useEffect(() => {
    if (token) {
      listPlayers();
      listAuditLog();
      setSelectedPlayerUpdateElo(1000);
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('shed-tournament-token');
    setToken(null);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  const addplayer = async (playerName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/addplayer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ player_name: playerName })
      });
      const data = await response.json();
      if (response.ok) {
        setStatusMessage(`Added ${playerName} successfully`);
        listPlayers(); // Refresh the player list
        listAuditLog(); // Refresh the audit log
      } else {
        setStatusMessage(`Error adding player ${playerName}`);
      }
    } catch (error) {
      setStatusMessage(`Error adding player ${playerName}: ${error}`);
    }
  };

  const updatePlayer = async (player_id: number, playerName: string, newElo: number) => {
    try {
      if (!player_id) {
        setUpdatePlayerMessage('No player selected');
        return;
      }

      if (!playerName || !newElo) {
        setUpdatePlayerMessage('Please fill in both name and ELO fields');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/players/${player_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          player_name: playerName,
          player_elo: newElo
        })
      });
      if (response.ok) {
        setUpdatePlayerMessage(`Successfully updated player ${playerName} (ID: ${player_id})`);
        setSelectedUpdatePlayer('');
        setSelectedPlayerUpdateName('');
        setSelectedPlayerUpdateElo(1000);
        listPlayers(); // Refresh the player list
        listAuditLog(); // Refresh the audit log
      } else {
        setUpdatePlayerMessage(`Error updating player ${playerName} (ID: ${player_id})`);
      }
    } catch (error) {
      setUpdatePlayerMessage(`Error updating player ${playerName} (ID: ${player_id}): ${error}`);
    }
  };

  const listPlayers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/players`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      setStatusMessage(`Error fetching players: ${error}`);
    }
  };

  const listAuditLog = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auditlog`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setAuditLog(data);
    } catch (error) {
      setStatusMessage(`Error fetching audit log: ${error}`);
    }
  };

  const recordMatch = async () => {
    try {
      const winner1Player = players.find(p => p.player_name === winner);
      const loser1Player = players.find(p => p.player_name === loser);
      
      if (!winner1Player || !loser1Player) {
        setMatchError('Please select both winner and loser');
        return;
      }

      if (isDoubles) {
        const winner2Player = players.find(p => p.player_name === winner2);
        const loser2Player = players.find(p => p.player_name === loser2);
        
        if (!winner2Player || !loser2Player) {
          setMatchError('Please select all players for doubles match');
          return;
        }

        // Check for duplicate players
        const playerIds = new Set([winner1Player.id, winner2Player.id, loser1Player.id, loser2Player.id]);
        if (playerIds.size !== 4) {
          setMatchError('Duplicate players not allowed in doubles match');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/record-match`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            is_doubles: true,
            winner1_id: winner1Player.id,
            winner2_id: winner2Player.id,
            loser1_id: loser1Player.id,
            loser2_id: loser2Player.id
          })
        });

        if (response.ok) {
          const data = await response.json();
          setStatusMessage(
            <Box>
              <Typography>Doubles match recorded successfully</Typography>
              <Typography>
                <Typography component="span" color="success.main">
                  {winner1Player.player_name}  (+{data.winners[0].elo_change}) & {winner2Player.player_name} (+{data.winners[1].elo_change})
                </Typography>
                {' '}beat{' '}
                <Typography component="span" color="error.main">
                  {loser1Player.player_name} ({data.losers[0].elo_change}) & {loser2Player.player_name} ({data.losers[1].elo_change})
                </Typography>
              </Typography>
            </Box>
          );
        } else {
          setStatusMessage('Error recording match');
        }
      } else {
        if (winner1Player.id === loser1Player.id) {
          setMatchError('Winner and loser cannot be the same player');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/record-match`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            is_doubles: false,
            winner1_id: winner1Player.id,
            loser1_id: loser1Player.id
          })
        });

        if (response.ok) {
          const data = await response.json();
          setStatusMessage(
            <Box>
              <Typography>Match recorded successfully</Typography>
              <Typography>
                <Typography component="span" color="success.main">{winner1Player.player_name} (+{data.winners[0].elo_change})</Typography>
                {' '}beat{' '}
                <Typography component="span" color="error.main">{loser1Player.player_name} ({data.losers[0].elo_change})</Typography>
              </Typography>
            </Box>
          );
        } else {
          setStatusMessage('Error recording match');
        }
      }

      listPlayers();
      listAuditLog();
      setOpenMatchDialog(false);
      setWinner('');
      setLoser('');
      setWinner2('');
      setLoser2('');
      setIsDoubles(false);
      setMatchError('');
    } catch (error) {
      setStatusMessage(`Error recording match: ${error}`);
    }
  };

  const deletePlayer = async (playerId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setStatusMessage(`Successfully deleted player (ID: ${playerId})`);
        listPlayers(); // Refresh the player list
        listAuditLog(); // Refresh the audit log
      } else {
        setStatusMessage(`Error deleting player (ID: ${playerId})`);
      }
    } catch (error) {
      setStatusMessage(`Error deleting player: ${error}`);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router basename="/shed">
          <Routes>
            <Route path="/" element={
              <div>
                <h1 className="wave-text">
                  Welcome to the Shed tournament
                </h1>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    size="large"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </Box>
                {/* Rest of your app content */}
              </div>
            } />
          </Routes>
          <Typography 
                  variant="h5" 
                  sx={{ 
                    textAlign: 'center', 
                    mb: 3,
                    fontStyle: 'italic',
                    color: 'text.secondary'
                  }}
                >
            {randomText}
          </Typography>
          <div style={{ margin: '1em', textAlign: 'center' }}>
            <h2>Players</h2>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 2,
              mb: 4,
              minHeight: '200px'
            }}>
              {players.slice(0, 3).map((player, index) => (
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
                    {player.player_name}
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
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Other Players</Typography>
              {players.slice(3).map((player) => (
                <Typography key={player.id} sx={{ mb: 1 }}>
                  {player.player_name} (ELO: {player.elo})
                </Typography>
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={() => setOpenMatchDialog(true)}
              >
                Record Match Result
              </Button>
            </Box>
            {statusMessage && (
              <Typography variant="h6" sx={{ mt: 2 }}>
                {statusMessage}
              </Typography>
            )}

            <h2>Player Administration</h2>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Add/Delete Players</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' }, // Stack vertically on mobile, horizontal on medium and up
                  justifyContent: 'center', 
                  gap: 4, 
                  mb: 3,
                  '& > *': { // Add margin between stacked items on mobile
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
                            addplayer(playerNameInput.value);
                          } else {
                            setStatusMessage('Please fill in a player name');
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
                      <Button
                        variant="contained"
                        color="error" 
                        onClick={async () => {
                          try {
                            const player = players.find(p => p.player_name.toLowerCase() === selectedPlayer.toLowerCase());
                            if (!player) {
                              setStatusMessage(`Player ${selectedPlayer} not found`);
                              return;
                            } else {
                              const player_id = player.id;
                              deletePlayer(player_id);
                            }
                          } catch (error) {
                            setStatusMessage(`Error deleting player ${selectedPlayer}: ${error}`);
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
                          const playerEloInput = document.getElementById('player-elo-input') as HTMLInputElement;
                          playerEloInput.value = player.elo.toString();
                          playerNameInput.value = player.player_name;
                          setSelectedPlayerUpdateName(player.player_name);
                          setSelectedPlayerUpdateElo(player.elo);
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
                      id="player-elo-input" 
                      label="New ELO" 
                      variant="outlined" 
                      InputLabelProps={{ shrink: true }} 
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
                      <Button
                        variant="contained"
                        onClick={() => {
                          const playerNameInput = document.getElementById('player-name-update-input') as HTMLInputElement;
                          const playerEloInput = document.getElementById('player-elo-input') as HTMLInputElement;
                          const player = players.find(p => p.id == parseInt(selectedUpdatePlayer));
                          if (player) {
                            updatePlayer(player.id, playerNameInput.value, parseInt(playerEloInput.value));
                            setSelectedUpdatePlayer('');
                            playerNameInput.value = '';
                            playerEloInput.value = '1000';
                          } else {
                            setUpdatePlayerMessage('No player selected to update');
                          }
                        }}
                      >
                        Update player
                      </Button>
                      {updatePlayerMessage && (
                        <Typography variant="h6" sx={{ mt: 2 }}>
                          {updatePlayerMessage}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
            
            <h2>Audit Log</h2>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>View Audit Log</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box id="auditlog">
                  {auditlog.map((log) => (
                    <Typography key={log.id}>{new Date(log.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '/').replace(',', ' -')} - {log.log}</Typography>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            <Dialog open={openMatchDialog} onClose={() => setOpenMatchDialog(false)}>
              <DialogTitle>Record Match Outcome</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography>Match Type:</Typography>
                    <Button
                      variant={isDoubles ? "contained" : "outlined"}
                      onClick={() => setIsDoubles(true)}
                    >
                      Doubles
                    </Button>
                    <Button
                      variant={!isDoubles ? "contained" : "outlined"}
                      onClick={() => setIsDoubles(false)}
                    >
                      Singles
                    </Button>
                  </Box>

                  <Box>
                    <Typography variant="h6">Winners</Typography>
                    <Select
                      value={winner}
                      onChange={(e) => setWinner(e.target.value)}
                      label="Winner 1"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {players.map((player) => (
                        <MenuItem key={player.id} value={player.player_name}>
                          {player.player_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {isDoubles && (
                      <Select
                        value={winner2}
                        onChange={(e) => setWinner2(e.target.value)}
                        label="Winner 2"
                        fullWidth
                      >
                        {players.map((player) => (
                          <MenuItem key={player.id} value={player.player_name}>
                            {player.player_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="h6">Losers</Typography>
                    <Select
                      value={loser}
                      onChange={(e) => setLoser(e.target.value)}
                      label="Loser 1"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {players.map((player) => (
                        <MenuItem key={player.id} value={player.player_name}>
                          {player.player_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {isDoubles && (
                      <Select
                        value={loser2}
                        onChange={(e) => setLoser2(e.target.value)}
                        label="Loser 2"
                        fullWidth
                      >
                        {players.map((player) => (
                          <MenuItem key={player.id} value={player.player_name}>
                            {player.player_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setOpenMatchDialog(false);
                  setWinner('');
                  setLoser('');
                  setWinner2('');
                  setLoser2('');
                  setIsDoubles(false);
                  setMatchError('');
                }}>Cancel</Button>
                <Button onClick={recordMatch} variant="contained">Record Match</Button>
              </DialogActions>
              {matchError && (
                <Typography variant="h6" sx={{ mt: 2, color: 'red', px: 2, pb: 2 }}>
                  {matchError}
                </Typography>
              )}
            </Dialog>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 