import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SnookerModeProps {
  open: boolean;
  onClose: () => void;
}

type ScoreSlot = 'top' | 'bottom';

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

const SnookerMode: React.FC<SnookerModeProps> = ({ open, onClose }) => {
  const [selectedScoreSlot, setSelectedScoreSlot] = useState<ScoreSlot>('top');
  const [scores, setScores] = useState<{ top: number; bottom: number }>({ top: 0, bottom: 0 });
  const [coloursEnabled, setColoursEnabled] = useState<boolean>(false);

  const currentTop = scores.top;
  const currentBottom = scores.bottom;

  function updateScore(delta: number) {
    setScores(prev => ({
      ...prev,
      [selectedScoreSlot]: prev[selectedScoreSlot] + delta
    }));
  }

  function handleRed() {
    updateScore(RED_VALUE);
    setColoursEnabled(true);
  }

  function handleColour(value: number) {
    if (!coloursEnabled) return;
    updateScore(value);
    setColoursEnabled(false);
  }

  function handleMissColour() {
    if (!coloursEnabled) return;
    setColoursEnabled(false);
  }

  function handleFoul() {
    // Simple foul handling: subtract 2 per press (press twice => -4)
    updateScore(-4);
    // Optionally mimic red flow (single next colour opportunity but still subtracts)
    // For simplicity, do not enable colours on foul; requirement focuses on -4 for two presses
    // Also, a foul ends the colour phase to re-enable reds
    setColoursEnabled(false);
  }

  function handleFoulColour(value: number) {
    updateScore(-value);
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

        

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Top</Typography>
              <Typography variant="h6" sx={{ m: 0 }}>{currentTop}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Bottom</Typography>
              <Typography variant="h6" sx={{ m: 0 }}>{currentBottom}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small"
              variant={selectedScoreSlot === 'top' ? 'contained' : 'outlined'}
              onClick={() => setSelectedScoreSlot('top')}
            >
              Top
            </Button>
            <Button 
              size="small"
              variant={selectedScoreSlot === 'bottom' ? 'contained' : 'outlined'}
              onClick={() => setSelectedScoreSlot('bottom')}
            >
              Bottom
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Reds</Typography>
            <Button
              variant="contained"
              onClick={handleRed}
              disabled={coloursEnabled}
              sx={ballButtonStyles('#B22222')}
            >
              +1
            </Button>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Colours</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLOURS.map(c => (
                <Button
                  key={c.key}
                  variant="contained"
                  onClick={() => handleColour(c.value)}
                  disabled={!coloursEnabled}
                  sx={ballButtonStyles(c.color)}
                >
                  +{c.value}
                </Button>
              ))}
              <Button
                variant="outlined"
                onClick={handleMissColour}
                disabled={!coloursEnabled}
                sx={{ minWidth: 56, height: 56, borderRadius: '50%' }}
              >
                Miss
              </Button>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {coloursEnabled ? 'Score on a ball' : 'Sink a red to score'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Foul</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleFoul}
              disabled={false}
            >
              -4
            </Button>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Foul (Colour)</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLOURS.map(c => (
                <Button
                  key={c.key}
                  variant="outlined"
                  onClick={() => handleFoulColour(c.value)}
                  disabled={false}
                  sx={ballButtonStyles(c.color)}
                >
                  -{c.value}
                </Button>
              ))}
            </Box>
          </Box>
          
        </Box>
      </Paper>
    </Box>
  );
};

export default SnookerMode;
