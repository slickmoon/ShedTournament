import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Select, MenuItem, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
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

interface StatsProps {
  playerStreakLongest: PlayerStreakLongest[];
  mostMatchesInDay: MostMatchesInDay;
  totalMatchStats: TotalMatchStats;
  matchesPerDay: MatchesPerDay[];
}

// Helper to calculate 2nd-degree polynomial regression points for trendline
function getPolynomialTrendline(data: MatchesPerDay[]) {
  if (data.length < 3) return [];
  // x: index, y: count
  const n = data.length;
  let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
  let sumY = 0, sumXY = 0, sumX2Y = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].count;
    sumX += x;
    sumX2 += x * x;
    sumX3 += x * x * x;
    sumX4 += x * x * x * x;
    sumY += y;
    sumXY += x * y;
    sumX2Y += x * x * y;
  }
  // Solve the normal equations for a, b, c in y = a*x^2 + b*x + c
  // Using Cramer's rule for 3x3 system
  const S = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4]
  ];
  const Y = [sumY, sumXY, sumX2Y];
  function det3(m) {
    return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])
         - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])
         + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  }
  function replaceCol(m, col, v) {
    return m.map((row, i) => row.map((val, j) => (j === col ? v[i] : val)));
  }
  const D = det3(S);
  const Da = det3(replaceCol(S, 0, Y));
  const Db = det3(replaceCol(S, 1, Y));
  const Dc = det3(replaceCol(S, 2, Y));
  const a = Da / D;
  const b = Db / D;
  const c = Dc / D;
  return data.map((d, i) => ({ date: d.date, trend: a * i * i + b * i + c }));
}

const Stats: React.FC<StatsProps> = ({
  playerStreakLongest,
  mostMatchesInDay,
  totalMatchStats,
  matchesPerDay
}) => {
  const trendlineData = getPolynomialTrendline(matchesPerDay);
  const yMin = Math.min(...matchesPerDay.map(d => d.count), 0);
  const yMax = Math.max(...matchesPerDay.map(d => d.count), 5);

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
    </>
  );
};

export default Stats; 