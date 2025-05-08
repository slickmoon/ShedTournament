import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, Button, Typography, Box, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import theme from './theme.ts';
import { API_BASE_URL } from './config.ts';
import './App.css';

const queryClient = new QueryClient();

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
  //run on startup
  React.useEffect(() => {
    listPlayers();
    listAuditLog();
  }, []);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [auditlog, setAuditLog] = useState<AuditLog[]>([]);
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [matchError, setMatchError] = useState<string>('');
  const [winner, setWinner] = useState<string>('');
  const [loser, setLoser] = useState<string>('');

  const addplayer = async (playerName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/addplayer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const listPlayers = async () => {
    const response = await fetch(`${API_BASE_URL}/players`);
    const data = await response.json();
    setPlayers(data);
  };

  const listAuditLog = async () => {
    const response = await fetch(`${API_BASE_URL}/auditlog`);
    const data = await response.json();
    setAuditLog(data);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winner_id: winnerPlayer.id,
          loser_id: loserPlayer.id
        })
      });

      if (response.ok) {
        setStatusMessage('Match recorded successfully');
        listPlayers();
        listAuditLog();
        setOpenMatchDialog(false);
      } else {
        setStatusMessage('Error recording match');
      }
    } catch (error) {
      setStatusMessage(`Error recording match: ${error}`);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={
              <h1 className="wave-text">
                Welcome to the Shed tournament
              </h1>
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

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <h2>Add Player</h2>
                <TextField id="player-name-input" label="Player Name" variant="outlined" />
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="contained"
                    onClick={() => {
                      const playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
                      addplayer(playerNameInput.value);
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
                          const response = await fetch(`${API_BASE_URL}/players/${player_id}`, {
                            method: 'DELETE'
                          });
                          if (response.ok) {
                            setStatusMessage(`Successfully deleted player ${selectedPlayer} (ID: ${player_id})`);
                            listPlayers(); // Refresh the player list
                            listAuditLog(); // Refresh the audit log
                          } else {
                            setStatusMessage(`Error deleting player ${selectedPlayer} (ID: ${player_id})`);
                          }
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
            </Box>

            {statusMessage && (
              <Typography variant="h6" sx={{ mt: 2 }}>
                {statusMessage}
              </Typography>
            )}

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
                <Button onClick={() => setOpenMatchDialog(false)}>Cancel</Button>
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