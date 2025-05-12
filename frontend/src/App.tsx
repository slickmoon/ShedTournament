import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, Button, Typography, Box } from '@mui/material';
import theme from './theme.ts';
import { API_BASE_URL } from './config.ts';
import { Login } from './components/Login.tsx';
import BouncingWednesday from './components/BouncingWednesday.tsx';
import PlayerPodium from './components/PlayerPodium.tsx';
import PlayerStreaks from './components/PlayerStreaks.tsx';
import PlayerAdmin from './components/PlayerAdmin.tsx';
import AuditLog from './components/AuditLog.tsx';
import MatchDialog from './components/MatchDialog.tsx';
import ScrabbleGame from './components/ScrabbleGame.tsx';
import { randomTexts, wednesdayTexts } from './data/shed-quotes.ts';
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

interface AuditLogEntry {
  id: number;
  log: string;
  timestamp: string;
}

interface PlayerStreak {
  player_id: number;
  player_name: string;
  current_streak: number;
  elo: number;
  elo_change: number;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | React.ReactNode>('');
  const [updatePlayerMessage, setUpdatePlayerMessage] = useState<string | React.ReactNode>('');
  const [auditlog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [matchError, setMatchError] = useState<string>('');
  const [winner, setWinner] = useState<string>('');
  const [loser, setLoser] = useState<string>('');
  const [randomText, setRandomText] = useState<string>('');
  const [isDoubles, setIsDoubles] = useState(false);
  const [winner2, setWinner2] = useState<string>('');
  const [loser2, setLoser2] = useState<string>('');
  const [playerStreaks, setPlayerStreaks] = useState<PlayerStreak[]>([]);
  const [isWednesday, setIsWednesday] = useState(false);

  // Load initial data and check token
  useEffect(() => {
    const storedToken = localStorage.getItem('shed-tournament-token');
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
    // Set random text on initial load
    const today = new Date();
    const isWednesdayToday = today.getDay() === 3;
    setIsWednesday(isWednesdayToday);
    if (isWednesdayToday) {
      setRandomText(wednesdayTexts[Math.floor(Math.random() * wednesdayTexts.length)]);
    } else {
      setRandomText(randomTexts[Math.floor(Math.random() * randomTexts.length)]);
    }
  }, []);

  // Load players and audit log when token is available
  useEffect(() => {
    if (token) {
      listPlayers();
      listAuditLog();
      listPlayerStreaks();
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('shed-tournament-token');
    setToken(null);
  };

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
        listPlayers();
        listAuditLog();
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
        listPlayers();
        listAuditLog();
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

  const listPlayerStreaks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/players/streaks`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setPlayerStreaks(data);
    } catch (error) {
      setStatusMessage(`Error fetching player streaks: ${error}`);
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
        listPlayers();
        listAuditLog();
      } else {
        setStatusMessage(`Error deleting player (ID: ${playerId})`);
      }
    } catch (error) {
      setStatusMessage(`Error deleting player: ${error}`);
    }
  };

  if (loading) {
    return null;
  }

  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {isWednesday && <BouncingWednesday />}
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

          <div style={{ margin: '1em', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                    <PlayerPodium players={players} />
                    <PlayerStreaks playerStreaks={playerStreaks} />
                  </Box>

                  {isWednesday && <ScrabbleGame />}

                  <PlayerAdmin
                    players={players}
                    onAddPlayer={addplayer}
                    onDeletePlayer={deletePlayer}
                    onUpdatePlayer={updatePlayer}
                    statusMessage={statusMessage}
                    updatePlayerMessage={updatePlayerMessage}
                  />

                  <AuditLog auditLog={auditlog} />
                </div>

                <MatchDialog
                  open={openMatchDialog}
                  onClose={() => {
                  setOpenMatchDialog(false);
                  setWinner('');
                  setLoser('');
                  setWinner2('');
                  setLoser2('');
                  setIsDoubles(false);
                  setMatchError('');
                  }}
                  onRecordMatch={recordMatch}
                  players={players}
                  isDoubles={isDoubles}
                  setIsDoubles={setIsDoubles}
                  winner={winner}
                  setWinner={setWinner}
                  loser={loser}
                  setLoser={setLoser}
                  winner2={winner2}
                  setWinner2={setWinner2}
                  loser2={loser2}
                  setLoser2={setLoser2}
                  matchError={matchError}
                />
          </div>
            } />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 