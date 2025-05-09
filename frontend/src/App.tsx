import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, Button, Typography, Box, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import theme from './theme.ts';
import { API_BASE_URL } from './config.ts';
import { Login } from './components/Login.tsx';
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

  // Load initial data and check token
  useEffect(() => {
    const storedToken = localStorage.getItem('shed-tournament-token');
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
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
      const winnerPlayer = players.find(p => p.player_name === winner);
      const loserPlayer = players.find(p => p.player_name === loser);
      
      if (!winnerPlayer || !loserPlayer) {
        setMatchError('Please select both winner and loser');
        return;
      }

      if (winnerPlayer.id == loserPlayer.id) {
        setMatchError('Winner and loser cannot be the same player');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/record-match`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          winner_id: winnerPlayer.id,
          loser_id: loserPlayer.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStatusMessage(
          <Box>
            <Typography>Match recorded successfully</Typography>
            <Typography>
              <Typography component="span" color="success.main">{winnerPlayer.player_name} (+{data.winner.elo_change})</Typography>
              {' '}beat{' '}
              <Typography component="span" color="error.main">{loserPlayer.player_name} ({data.loser.elo_change})</Typography>
            </Typography>
          </Box>
        );
        listPlayers();
        listAuditLog();
        setOpenMatchDialog(false);
        setWinner('');
        setLoser('');
        setMatchError('');
      } else {
        setStatusMessage('Error recording match');
      }
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
          <div style={{ margin: '1em', textAlign: 'center' }}>
            <h2>Players</h2>
            <p id="playerlist">
              {players.map((player) => (
                <div key={player.id}>
                  {player.player_name} (ELO: {player.elo})
                </div>
              ))}
            </p>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={() => setOpenMatchDialog(true)}
              >
                Record Match
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
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <h2>Add Player</h2>
                    <TextField id="player-name-input" label="Player Name" variant="outlined" InputLabelProps={{ shrink: true }} />
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

                  <Box sx={{ textAlign: 'center' }}>
                    <h2>Delete Player</h2>
                    <Select
                      id="player-delete-input"
                      label="Player Name"
                      variant="outlined"
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      sx={{ minWidth: 200 }}
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
                  <Box sx={{ textAlign: 'center' }}>
                    <h2>Manually Update Player details</h2>
                    <Select
                      id="player-update-input"
                      label="Player Name"
                      variant="outlined"
                      value={selectedUpdatePlayer}
                      onChange={(e) => setSelectedUpdatePlayer(e.target.value)}
                      sx={{ minWidth: 200 }}
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
                    <TextField id="player-id-read-only" label="Player ID" variant="outlined" value={selectedUpdatePlayer} disabled />
                    <TextField id="player-elo-input" label="New ELO" variant="outlined" InputLabelProps={{ shrink: true }} />
                    <TextField id="player-name-update-input" label="New Name" variant="outlined" InputLabelProps={{ shrink: true }} />
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
                    <Typography key={log.id}>{log.timestamp} - {log.log}</Typography>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            <Dialog open={openMatchDialog} onClose={() => setOpenMatchDialog(false)}>
              <DialogTitle>Record Match Outcome</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <h2>Winner</h2>
                  <Select
                    value={winner}
                    onChange={(e) => setWinner(e.target.value)}
                    label="Winner"
                  >
                    {players.map((player) => (
                      <MenuItem key={player.id} value={player.player_name}>
                        {player.player_name}
                      </MenuItem>
                    ))}
                  </Select>
                  <br />
                  <h2>Loser</h2>
                  <Select
                    value={loser}
                    onChange={(e) => setLoser(e.target.value)}
                    label="Loser"
                  >
                    {players.map((player) => (
                      <MenuItem key={player.id} value={player.player_name}>
                        {player.player_name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setOpenMatchDialog(false);
                  setWinner('');
                  setLoser('');
                  setMatchError('');
                }}>Cancel</Button>
                <Button onClick={recordMatch} variant="contained">Record Match</Button>
              </DialogActions>
              {matchError && (
                    <Typography variant="h6" sx={{ mt: 2 , color: 'red'}}>
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