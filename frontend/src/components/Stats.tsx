import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Select, MenuItem, Typography, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlayerStreakLongest {
  player_id: number;
  player_name: string;
  longest_streak: number;
  longest_streak_elo_change: number;
  streak_type: string;
}

interface MostMatchesInDay {
  player_id: number;
  player_name: string;
  date: string;
  matches_played: number;
}

interface TotalMatchStats {
  total_matches: number;
  money_saved: number;
  time_wasted: number;
  per_person_time_wasted: number;
}

interface MatchesPerDay {
  date: string;
  count: number;
}

interface Player {
  id: number;
  player_name: string;
}

interface HeadToHeadStats {
  player1: {
    id: number;
    name: string;
    wins: number;
    losses: number;
    win_percentage: number;
    elo_gained: number;
    current_elo: number;
  };
  player2: {
    id: number;
    name: string;
    wins: number;
    losses: number;
    win_percentage: number;
    elo_gained: number;
    current_elo: number;
  };
  total_matches: number;
  most_frequent_day: string | null;
  most_frequent_day_count: number;
  day_breakdown: Record<string, number>;
}

interface StatsProps {
  playerStreakLongest: PlayerStreakLongest[];
  mostMatchesInDay: MostMatchesInDay;
  totalMatchStats: TotalMatchStats;
  matchesPerDay: MatchesPerDay[];
  players: Player[];
  onPlayerSelect: (playerId: number | null) => void;
}


// Helper to calculate linear regression points for trendline
function getTrendline(data: MatchesPerDay[]) {
  if (data.length < 2) return [];
  // x: index, y: count
  const n = data.length;
  const sumX = data.reduce((acc, _, i) => acc + i, 0);
  const sumY = data.reduce((acc, d) => acc + d.count, 0);
  const sumXY = data.reduce((acc, d, i) => acc + i * d.count, 0);
  const sumXX = data.reduce((acc, _, i) => acc + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return data.map((d, i) => ({ date: d.date, trend: slope * i + intercept }));
}

const Stats: React.FC<StatsProps> = ({
  playerStreakLongest,
  mostMatchesInDay,
  totalMatchStats,
  matchesPerDay,
  players,
  onPlayerSelect
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const trendlineData = getTrendline(matchesPerDay);
  const yMin = Math.min(...matchesPerDay.map(d => d.count), 0);
  const yMax = Math.max(...matchesPerDay.map(d => d.count), 5);

  const handlePlayerChange = (event: SelectChangeEvent<number>) => {
    const value = Number(event.target.value);
    setSelectedPlayerId(value === -1 ? null : value);
    onPlayerSelect(value === -1 ? null : value);
  };

  // Head-to-head state and logic
  const [player1Id, setPlayer1Id] = useState<number>(-1);
  const [player2Id, setPlayer2Id] = useState<number>(-1);
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('shed-tournament-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchHeadToHeadStats = async () => {
    if (player1Id === -1 || player2Id === -1 || player1Id === player2Id) {
      setError('Please select two different players');
      setStats(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/shedapi/stats/head-to-head?player1_id=${player1Id}&player2_id=${player2Id}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          setStats(null);
        } else {
          setStats(data);
        }
      } else {
        setError('Failed to fetch head-to-head statistics');
        setStats(null);
      }
    } catch (error) {
      setError(`Error: ${error}`);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats when both players are selected
  React.useEffect(() => {
    if (player1Id !== -1 && player2Id !== -1 && player1Id !== player2Id) {
      fetchHeadToHeadStats();
    } else {
      setStats(null);
      setError('');
    }
    // eslint-disable-next-line
  }, [player1Id, player2Id]);

  return (
    <>
      <h2>Player Statistics</h2>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>View Player Stats</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Winning Streak Record box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            {[...playerStreakLongest]
              .filter(streak => streak.streak_type === "win")
              .sort((a, b) => b.longest_streak - a.longest_streak)
              .slice(0, 1)
              .map((playerStreakLongest) => (
              <Box
                key={playerStreakLongest.player_id}
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
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Longest Winning Streak
                    </Typography>
                    <Typography component="span">{playerStreakLongest.player_name} with </Typography>
                    <Typography component="span" sx={{ color: 'success.main' }}>
                      {playerStreakLongest.longest_streak} wins (+{playerStreakLongest.longest_streak_elo_change})
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
          {/* Losing Streak Record box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            {[...playerStreakLongest]
              .filter(streak => streak.streak_type === "loss")
              .sort((a, b) => b.longest_streak - a.longest_streak)
              .slice(0, 1)
              .map((playerStreakLongest) => (
              <Box
                key={playerStreakLongest.player_id}
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
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Longest Losing Streak
                    </Typography>
                    <Typography component="span">{playerStreakLongest.player_name} with </Typography>
                    <Typography component="span" sx={{ color: 'error.main' }}>
                      {playerStreakLongest.longest_streak} losses ({playerStreakLongest.longest_streak_elo_change})
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
          {/* Most Matches in a Day box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
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
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Most Matches in a Day
                  </Typography>
                  <Typography component="span">{mostMatchesInDay.player_name} played </Typography>
                  <Typography component="span" sx={{ color: 'info.main' }}>
                    {mostMatchesInDay.matches_played} matches
                  </Typography>
                  <Typography component="span"> on {new Date(mostMatchesInDay.date).toLocaleDateString()}</Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
          {/* Total Matches box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
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
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Total Matches Played
                  </Typography>
                  <Typography component="span" sx={{ color: 'info.main' }}>
                    {totalMatchStats.total_matches}
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
          {/* Money Saved box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
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
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Money Saved at the Pub
                  </Typography>
                  <Typography component="span" sx={{ color: 'success.main' }}>
                    ${totalMatchStats.money_saved}
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
          {/* Time wasted box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
            <Box
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
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Time Wasted in The Shed
                  </Typography>
                  <Typography component="span" sx={{ color: 'success.main' }}>{totalMatchStats.time_wasted / 60}</Typography>
                  <Typography component="span"> hours game time wasting </Typography>
                  <Typography component="span" sx={{ color: 'success.main' }}>{totalMatchStats.per_person_time_wasted / 60}</Typography>
                  <Typography component="span"> total hours</Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
          {/* Matches Played Per Day box */}
          <Paper elevation={3} sx={{ p: 2, maxWidth: 600, mx: 'auto', width: '100%' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Matches Played Per Day
            </Typography>
            <Box sx={{ mb: 2, maxWidth: 300, mx: 'auto', display: 'flex', justifyContent: 'center' }}>
              <Select
                value={selectedPlayerId === null ? -1 : selectedPlayerId}
                onChange={handlePlayerChange}
                fullWidth
              >
                <MenuItem value={-1}>All Time</MenuItem>
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.id}>{player.player_name}</MenuItem>
                ))}
              </Select>
            </Box>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={matchesPerDay} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} label={{ value: 'Matches', angle: -90, position: 'insideLeft', fontSize: 12 }} domain={[yMin, yMax]} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} dot={{ r: 2 }} />
                {/* Trendline */}
                <Line type="monotone" dataKey="trend" data={trendlineData} stroke="#888" strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </AccordionDetails>
      </Accordion>
      {/* Head-to-Head Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Head-to-Head Player Stats</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Select
                value={player1Id}
                onChange={e => setPlayer1Id(Number(e.target.value))}
                displayEmpty
                sx={{ minWidth: 180 }}
              >
                <MenuItem value={-1}>Select Player 1</MenuItem>
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.id}>{player.player_name}</MenuItem>
                ))}
              </Select>
              <Select
                value={player2Id}
                onChange={e => setPlayer2Id(Number(e.target.value))}
                displayEmpty
                sx={{ minWidth: 180 }}
              >
                <MenuItem value={-1}>Select Player 2</MenuItem>
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.id}>{player.player_name}</MenuItem>
                ))}
              </Select>
            </Box>
            {loading && <Typography>Loading...</Typography>}
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            {stats && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                  {stats.player1.name} vs {stats.player2.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, justifyContent: 'center' }}>
                  {/* Player 1 Stats */}
                  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', minWidth: 220 }}>
                    <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                      {stats.player1.name}
                    </Typography>
                    <Typography variant="h4" color="success.main" sx={{ mb: 1 }}>
                      {stats.player1.wins} - {stats.player1.losses}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Win Rate: {stats.player1.win_percentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ELO Gained: {stats.player1.elo_gained > 0 ? '+' : ''}{stats.player1.elo_gained}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current ELO: {stats.player1.current_elo}
                    </Typography>
                  </Paper>
                  {/* Player 2 Stats */}
                  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', minWidth: 220 }}>
                    <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                      {stats.player2.name}
                    </Typography>
                    <Typography variant="h4" color="success.main" sx={{ mb: 1 }}>
                      {stats.player2.wins} - {stats.player2.losses}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Win Rate: {stats.player2.win_percentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ELO Gained: {stats.player2.elo_gained > 0 ? '+' : ''}{stats.player2.elo_gained}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current ELO: {stats.player2.current_elo}
                    </Typography>
                  </Paper>
                </Box>
                {/* Match Summary */}
                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Match Summary
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Total Matches: {stats.total_matches}
                  </Typography>
                  {stats.most_frequent_day && (
                    <Typography variant="body1">
                      Most Frequent Play Day: {stats.most_frequent_day} ({stats.most_frequent_day_count} matches)
                    </Typography>
                  )}
                </Paper>
                {/* Day Breakdown */}
                {stats.day_breakdown && Object.keys(stats.day_breakdown).length > 0 && (
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Matches by Day of Week
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {Object.entries(stats.day_breakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([day, count]) => (
                          <Box key={day} sx={{ textAlign: 'center', p: 1, minWidth: 80 }}>
                            <Typography variant="body2" color="text.secondary">
                              {day}
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {count}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default Stats; 