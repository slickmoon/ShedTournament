import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, IconButton, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Player } from '../types/Player.ts';

interface SnookerModeProps {
  players: Player[];
  open: boolean;
  onClose: () => void;
}

type PlayerScoreMap = Record<number, number>;

const RED_VALUE = 1;
const COLOURS = [
  { key: 'yellow', label: 'Yellow', value: 2, color: '#FFD700' },
  { key: 'green', label: 'Green', value: 3, color: '#228B22' },
  { key: 'brown', label: 'Brown', value: 4, color: '#8B4513' },
  { key: 'blue', label: 'Blue', value: 5, color: '#1E90FF' },
  { key: 'pink', label: 'Pink', value: 6, color: '#FF69B4' },
  { key: 'black', label: 'Black', value: 7, color: '#000000' }
];

const overlayStyles = {
  position: 'fixed' as const,
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 1300
};

const panelStyles = {
  width: { xs: '95%', md: 600 },
  maxWidth: '95vw',
  p: 3
};

const ballButtonStyles = (bg: string) => ({
  minWidth: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: bg,
  color: '#fff',
  '&:disabled': { opacity: 0.4 }
});

const SnookerMode: React.FC<SnookerModeProps> = ({ players, open, onClose }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | ''>('');
  const [scoresByPlayer, setScoresByPlayer] = useState<PlayerScoreMap>({});
  const [coloursEnabled, setColoursEnabled] = useState<boolean>(false);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [players]);

  const currentScore = selectedPlayerId === '' ? 0 : (scoresByPlayer[selectedPlayerId] ?? 0);

  function updateScore(delta: number) {
    if (selectedPlayerId === '') return;
    setScoresByPlayer(prev => ({
      ...prev,
      [selectedPlayerId]: (prev[selectedPlayerId] ?? 0) + delta
    }));
  }

  function handleRed() {
    if (selectedPlayerId === '') return;
    updateScore(RED_VALUE);
    setColoursEnabled(true);
  }

  function handleColour(value: number) {
    if (selectedPlayerId === '') return;
    if (!coloursEnabled) return;
    updateScore(value);
    setColoursEnabled(false);
  }

  function handleMissColour() {
    if (!coloursEnabled) return;
    setColoursEnabled(false);
  }

  function handleFoul() {
    if (selectedPlayerId === '') return;
    // Simple foul handling: subtract 2 per press (press twice => -4)
    updateScore(-2);
    // Optionally mimic red flow (single next colour opportunity but still subtracts)
    // For simplicity, do not enable colours on foul; requirement focuses on -4 for two presses
    // Also, a foul ends the colour phase to re-enable reds
    setColoursEnabled(false);
  }

  if (!open) return null;

  return (
    <Box sx={overlayStyles}>
      <Paper elevation={6} sx={panelStyles}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Snooker Mode</Typography>
          <IconButton onClick={onClose} aria-label="Close snooker mode" size="large">
            <CloseIcon />
          </IconButton>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="snooker-player-select-label">Select Player</InputLabel>
          <Select
            labelId="snooker-player-select-label"
            value={selectedPlayerId}
            label="Select Player"
            onChange={(e) => setSelectedPlayerId(e.target.value as number | '')}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {sortedPlayers.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.player_name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Current Score: {currentScore}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Reds</Typography>
            <Button
              variant="contained"
              onClick={handleRed}
              disabled={selectedPlayerId === '' || coloursEnabled}
              sx={ballButtonStyles('#B22222')}
            >
              +1
            </Button>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Foul</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleFoul}
              disabled={selectedPlayerId === ''}
            >
              -2
            </Button>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Press twice to subtract 4
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Colours</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLOURS.map(c => (
                <Button
                  key={c.key}
                  variant="contained"
                  onClick={() => handleColour(c.value)}
                  disabled={selectedPlayerId === '' || !coloursEnabled}
                  sx={ballButtonStyles(c.color)}
                >
                  +{c.value}
                </Button>
              ))}
              <Button
                variant="outlined"
                onClick={handleMissColour}
                disabled={selectedPlayerId === '' || !coloursEnabled}
                sx={{ minWidth: 56, height: 56, borderRadius: '50%' }}
              >
                Miss
              </Button>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {coloursEnabled ? 'Score on a ball' : 'Sink a red to score'}
            </Typography>
          </Box>

          
        </Box>
      </Paper>
    </Box>
  );
};

export default SnookerMode;
