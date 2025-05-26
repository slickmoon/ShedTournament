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
import PlayerStats from './components/PlayerStats.tsx';
import PlayerKD from './components/PlayerKD.tsx';
import PlayerAdmin from './components/PlayerAdmin.tsx';
import AuditLog from './components/AuditLog.tsx';
import MatchDialog from './components/MatchDialog.tsx';
import ScrabbleGame from './components/ScrabbleGame.tsx';
import { randomTexts, wednesdayTexts } from './data/shed-quotes.ts';
import { checkSpecialMatchResult } from './utils/matchChecks.ts';
import SpecialMatchGraphic from './components/SpecialMatchGraphic.tsx';
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
  total_matches: number;
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
interface PlayerStreakLongest {
  player_id: number;
  player_name: string;
  longest_streak: number;
  longest_streak_elo_change: number;
  streak_type: string;
}

interface PlayerKD {
  player_id: number;
  player_name: string;
  wins: number;
  losses: number;
  kd: number;
}

interface MostMatchesInDay {
  player_id: number;
  player_name: string;
  date: string;
  matches_played: number;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | React.ReactNode>('');
  const [updatePlayerMessage, setPlayerAdminMessage] = useState<string | React.ReactNode>('');
  const [auditlog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [matchError, setMatchError] = useState<string>('');
  const [winner, setWinner] = useState<string>('');
  const [loser, setLoser] = useState<string>('');
  const [randomText, setRandomText] = useState<string>('');
  const [isDoubles, setIsDoubles] = useState(false);
  const [winner2, setWinner2] = useState<string>('');
  const [loser2, setLoser2] = useState<string>('');
  const [isRecordingMatch, setIsRecordingMatch] = useState(false);
  const [playerStreaks, setPlayerStreaks] = useState<PlayerStreak[]>([]);
  const [playerStreakLongest, setPlayerStreakLongest] = useState<PlayerStreakLongest[]>([]);
  const [playerKd, setPlayerKD] = useState<PlayerKD[]>([]);
  const [isWednesday, setIsWednesday] = useState(false);
  const [specialMatchResults, setSpecialMatchResults] = useState<Array<{ message: string; color: string }>>([]);
  const [mostMatchesInDay, setMostMatchesInDay] = useState<MostMatchesInDay>({
    player_id: 0,
    player_name: '',
    date: '',
    matches_played: 0
  });

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
      updatePageData();
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('shed-tournament-token');
    setToken(null);
  };

  {/* Data view functions */}
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

  const getPlayerStats = async () => {
    // Player Streaks
    try {
      const response = await fetch(`${API_BASE_URL}/players/streaks`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setPlayerStreaks(data);
    } catch (error) {
      setStatusMessage(`Error fetching player streaks: ${error}`);
    }
    
    // Longest player streaks
    try {
      const response = await fetch(`${API_BASE_URL}/players/streaks/longest`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setPlayerStreakLongest(data);
    } catch (error) {
      setStatusMessage(`Error fetching longest player streak: ${error}`);
    }

    // Player KD Ratios
    try {
      const response = await fetch(`${API_BASE_URL}/players/kds`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setPlayerKD(data);
    } catch (error) {
      setStatusMessage(`Error fetching player KD: ${error}`);
    }

    // Most matches in a day
    try {
      const response = await fetch(`${API_BASE_URL}/matches/most`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setMostMatchesInDay(data);
    } catch (error) {
      setStatusMessage(`Error fetching most matches in day: ${error}`);
    }
  };
  
  {/* Called to refresh the page data after data modifications occur */}
  const updatePageData = () => { 
    listPlayers();
    listAuditLog();
    listPlayerStreaks();
    getPlayerStats();
  };


  {/* Data edit functions */}
  const addplayer = async (playerName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/addplayer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ player_name: playerName })
      });
      const data = await response.json();
      if (response.ok) {
        setPlayerAdminMessage(`Added ${playerName} successfully`);
        updatePageData();
      } else {
        const errorData = await response.json();
        setPlayerAdminMessage(`Error adding player ${playerName}: ${errorData.detail}`);
      }
    } catch (error) {
      setPlayerAdminMessage(`Error adding player ${playerName}: ${error}`);
    }
  };

  const updatePlayer = async (player_id: number, playerName: string, newElo: number, access_password: string) => {
    try {
      if (!player_id) {
        setPlayerAdminMessage('No player selected');
        return;
      }

      if (!playerName || !newElo) {
        setPlayerAdminMessage('Please fill in both name and ELO fields');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/players/${player_id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'X-Admin-Password': access_password
        },
        body: JSON.stringify({
          player_name: playerName,
          player_elo: newElo
        })
      });
      if (response.ok) {
        setPlayerAdminMessage(`Successfully updated player ${playerName} (#${player_id})`);
        updatePageData();
      } else {
        const errorData = await response.json();
        setPlayerAdminMessage(`Error updating player ${playerName} (#${player_id}): ${errorData.detail}`);
      }
    } catch (error) {
      setPlayerAdminMessage(`Error updating player ${playerName} (#${player_id}): ${error}`);
    }
  };
  
  const deletePlayer = async (playerId: number, access_password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'X-Admin-Password': access_password
        }
      });
      if (response.ok) {
        setPlayerAdminMessage(`Successfully deleted player (ID: ${playerId})`);
        updatePageData();
      } else {
        const errorData = await response.json();
        setPlayerAdminMessage(`Error deleting player (ID: ${playerId}): ${errorData.detail}`);
      }
    } catch (error) {
      setPlayerAdminMessage(`Error deleting player: ${error}`);
    }
  };

  const recordMatch = async () => {
    try {
      setIsRecordingMatch(true);
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
          setSpecialMatchResults(checkSpecialMatchResult(data, players));
        } else {
          const errorData = await response.json();
          setStatusMessage(`Error recording match: ${errorData.detail}`);
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
          setSpecialMatchResults(checkSpecialMatchResult(data, players));
        } else {
          const errorData = await response.json();
          setStatusMessage(`Error recording match: ${errorData.detail}`);
        }
      }

      updatePageData();

      setOpenMatchDialog(false);
      setWinner('');
      setLoser('');
      setWinner2('');
      setLoser2('');
      setIsDoubles(false);
      setMatchError('');
    } catch (error) {
      setStatusMessage(`Error recording match: ${error}`);
    } finally {
      setIsRecordingMatch(false);
    }
  };

  const handleSpecialMatchComplete = () => {
    setSpecialMatchResults(prev => prev.slice(1));
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

  const currentSpecialMatch = specialMatchResults[0];

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
          <Typography 
                  variant="h5" 
                  sx={{ 
                    textAlign: 'center', 
                    mb: 3,
                    mx: 2,
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
            {statusMessage && (
              <Typography variant="h6" sx={{ mb: 3 }}>
                {statusMessage}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                    <PlayerPodium players={players} />
                    <PlayerStreaks playerStreaks={playerStreaks} />
                    <PlayerKD playerKd={playerKd} />
                  </Box>

                  {isWednesday && <ScrabbleGame />}
                  
                  <PlayerStats 
                    playerStreakLongest={playerStreakLongest}
                    mostMatchesInDay={mostMatchesInDay}
                  />

                  <PlayerAdmin
                    players={players}
                    onAddPlayer={addplayer}
                    onDeletePlayer={deletePlayer}
                    onUpdatePlayer={updatePlayer}
                    playerAdminMessage={updatePlayerMessage}
                  />

                  <AuditLog auditLog={auditlog} />
                </div>
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
                  isLoading={isRecordingMatch}
                />
                
          </div>
            } />
          </Routes>
        </Router>
        {currentSpecialMatch && (
          <SpecialMatchGraphic
            message={currentSpecialMatch.message}
            color={currentSpecialMatch.color}
            onComplete={handleSpecialMatchComplete}
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 