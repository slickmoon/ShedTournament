import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Remove as RemoveIcon,
  Sports as SportsIcon
} from '@mui/icons-material';
import { Player } from '../types/Player';

interface SnookerModeProps {
  players: Player[];
  open: boolean;
  onClose: () => void;
}

interface Team {
  id: number;
  name: string;
  players: Player[];
  score: number;
}

interface SnookerBall {
  name: string;
  color: string;
  points: number;
  count: number;
}

const SNOOKER_BALLS: SnookerBall[] = [
  { name: 'Red', color: '#d32f2f', points: 1, count: 15 },
  { name: 'Yellow', color: '#fbc02d', points: 2, count: 1 },
  { name: 'Green', color: '#388e3c', points: 3, count: 1 },
  { name: 'Brown', color: '#8d6e63', points: 4, count: 1 },
  { name: 'Blue', color: '#1976d2', points: 5, count: 1 },
  { name: 'Pink', color: '#e91e63', points: 6, count: 1 },
  { name: 'Black', color: '#212121', points: 7, count: 1 }
];

const SnookerMode: React.FC<SnookerModeProps> = ({ players, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: 'Team 1', players: [], score: 0 },
    { id: 2, name: 'Team 2', players: [], score: 0 }
  ]);
  
  const [selectedPlayer, setSelectedPlayer] = useState<number | ''>('');
  const [selectedTeam, setSelectedTeam] = useState<number>(1);
  const [ballCounts, setBallCounts] = useState<{ [key: string]: number }>({
    'Red': 15,
    'Yellow': 1,
    'Green': 1,
    'Brown': 1,
    'Blue': 1,
    'Pink': 1,
    'Black': 1
  });

  const handleAddPlayerToTeam = () => {
    if (!selectedPlayer) return;
    
    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;

    // Check if player is already on a team
    const isPlayerOnTeam = teams.some(team => 
      team.players.some(p => p.id === selectedPlayer)
    );
    
    if (isPlayerOnTeam) {
      alert('Player is already on a team!');
      return;
    }

    // Check team size limit
    const team = teams.find(t => t.id === selectedTeam);
    if (team && team.players.length >= 2) {
      alert('Team is full! Maximum 2 players per team.');
      return;
    }

    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === selectedTeam 
          ? { ...team, players: [...team.players, player] }
          : team
      )
    );
    
    setSelectedPlayer('');
  };

  const handleRemovePlayerFromTeam = (teamId: number, playerId: number) => {
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, players: team.players.filter(p => p.id !== playerId) }
          : team
      )
    );
  };

  const handleAddPoints = (ballName: string, points: number) => {
    if (ballCounts[ballName] <= 0) return;
    
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === selectedTeam
          ? { ...team, score: team.score + points }
          : team
      )
    );
    
    setBallCounts(prev => ({
      ...prev,
      [ballName]: prev[ballName] - 1
    }));
  };

  const handleResetGame = () => {
    setTeams(prevTeams =>
      prevTeams.map(team => ({ ...team, players: [], score: 0 }))
    );
    setBallCounts({
      'Red': 15,
      'Yellow': 1,
      'Green': 1,
      'Brown': 1,
      'Blue': 1,
      'Pink': 1,
      'Black': 1
    });
  };

  const availablePlayers = players.filter(player => 
    !teams.some(team => team.players.some(p => p.id === player.id))
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          minHeight: isMobile ? '100vh' : '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '2px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsIcon sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Snooker Mode
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Team Selection */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                Team Selection
              </Typography>
              
              {/* Add Player to Team */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'white' }}>Select Player</InputLabel>
                      <Select
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{ 
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }
                        }}
                      >
                        {availablePlayers.map(player => (
                          <MenuItem key={player.id} value={player.id}>
                            {player.player_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'white' }}>Team</InputLabel>
                      <Select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(Number(e.target.value))}
                        sx={{ 
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
                        }}
                      >
                        <MenuItem value={1}>Team 1</MenuItem>
                        <MenuItem value={2}>Team 2</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      onClick={handleAddPlayerToTeam}
                      disabled={!selectedPlayer}
                      fullWidth
                      sx={{ 
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        '&:hover': { background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)' }
                      }}
                    >
                      Add Player
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Teams Display */}
              {teams.map(team => (
                <Card key={team.id} sx={{ 
                  mb: 2, 
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {team.name} - Score: {team.score}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {team.players.map(player => (
                        <Chip
                          key={player.id}
                          label={player.player_name}
                          onDelete={() => handleRemovePlayerFromTeam(team.id, player.id)}
                          deleteIcon={<RemoveIcon />}
                          sx={{ 
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            '& .MuiChip-deleteIcon': { color: 'white' }
                          }}
                        />
                      ))}
                      {team.players.length === 0 && (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          No players selected
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>

          {/* Scoring Panel */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                Scoring Panel
              </Typography>
              
              {/* Current Team Selection */}
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white' }}>Scoring for Team</InputLabel>
                  <Select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(Number(e.target.value))}
                    sx={{ 
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <MenuItem value={1}>Team 1 ({teams[0].score} points)</MenuItem>
                    <MenuItem value={2}>Team 2 ({teams[1].score} points)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Ball Buttons */}
              <Grid container spacing={2}>
                {SNOOKER_BALLS.map(ball => (
                  <Grid item xs={6} sm={4} key={ball.name}>
                    <Button
                      variant="contained"
                      onClick={() => handleAddPoints(ball.name, ball.points)}
                      disabled={ballCounts[ball.name] <= 0}
                      fullWidth
                      sx={{
                        background: ball.color,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        py: 2,
                        '&:hover': {
                          background: ball.color,
                          filter: 'brightness(1.1)'
                        },
                        '&:disabled': {
                          background: 'rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.3)'
                        }
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {ball.name}
                        </Typography>
                        <Typography variant="caption">
                          {ball.points} pts ({ballCounts[ball.name]} left)
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleResetGame}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      background: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Reset Game
                </Button>
                <Button
                  variant="contained"
                  onClick={onClose}
                  sx={{
                    background: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
                    '&:hover': { background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)' }
                  }}
                >
                  Close
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default SnookerMode;
