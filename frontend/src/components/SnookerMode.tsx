import React, { useEffect, useState } from 'react';
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
  const [coloursEnabled, setColoursEnabled] = useState<Record<string, boolean>>({
    yellow: false,
    green: false,
    brown: false,
    blue: false,
    pink: false,
    black: false
  });
  const [redCount, setRedCount] = useState<number>(15);

  async function fetchState() {
    try {
      const token = localStorage.getItem('shed-tournament-token');
      const res = await fetch(`/shedapi/snooker/state`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setScores({ top: data.top, bottom: data.bottom });
      setColoursEnabled(data.colours_enabled);
      setRedCount(data.red_count)
    } catch {}
  }

  async function sendAction(action: any) {
    try {
      const token = localStorage.getItem('shed-tournament-token');
      const res = await fetch(`/shedapi/snooker/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(action)
      });
      const data = await res.json();
      setScores({ top: data.top, bottom: data.bottom });
      setColoursEnabled(data.colours_enabled);
      setRedCount(data.red_count);
    } catch {}
  }

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, []);

  const currentTop = scores.top;
  const currentBottom = scores.bottom;

  function updateScore(delta: number) {
    const type = delta > 0 ? (delta === 1 ? 'red' : 'colour') : (delta === -4 ? 'foul' : 'foul_colour');
    const value = Math.abs(delta) === 1 ? undefined : Math.abs(delta);
    sendAction({ type, slot: selectedScoreSlot, value });
  }

  function handleRed() {
    sendAction({ type: 'red', slot: selectedScoreSlot });
  }

  function handleColour(colour: string) {
    if (!coloursEnabled[colour]) return;
    sendAction({ type: 'colour', slot: selectedScoreSlot, colour });
  }

  function handleMissColour() {
    const anyColourEnabled = Object.values(coloursEnabled).some(enabled => enabled);
    if (!anyColourEnabled) return;
    sendAction({ type: 'miss' });
  }

  function handleFoul() {
    sendAction({ type: 'foul', slot: selectedScoreSlot });
  }

  function handleFoulRed() {
    sendAction({ type: 'foul_red', slot: selectedScoreSlot})
  }

  function handleFoulColour(colour: string) {
    sendAction({ type: 'foul_colour', slot: selectedScoreSlot, colour });
  }

  function handleReset() {
    sendAction({ type: 'reset' });
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleRed}
                disabled={redCount <= 0}
                sx={ballButtonStyles('#B22222')}
              >
                +1
              </Button>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Reds remaining: {redCount}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Colours</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLOURS.map(c => (
                <Button
                  key={c.key}
                  variant="contained"
                  onClick={() => handleColour(c.key)}
                  disabled={!coloursEnabled[c.key]}
                  sx={ballButtonStyles(c.color)}
                >
                  +{c.value}
                </Button>
              ))}
              <Button
                variant="outlined"
                onClick={handleMissColour}
                disabled={!Object.values(coloursEnabled).some(enabled => enabled)}
                sx={{ minWidth: 56, height: 56, borderRadius: '50%' }}
              >
                Miss
              </Button>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {Object.values(coloursEnabled).some(enabled => enabled) ? 'Score on a ball' : 'Sink a red to score'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Foul (Colour)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Button
              variant="contained"
              onClick={handleFoulRed}
              sx={ballButtonStyles('#B22222')}
            >
              -4
            </Button>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {COLOURS.map(c => (
                  <Button
                    key={c.key}
                    variant="outlined"
                    onClick={() => handleFoulColour(c.key)}
                    disabled={false}
                    sx={ballButtonStyles(c.color)}
                  >
                    -{c.value}
                  </Button>
                ))}
              </Box>
              <Button
                variant="outlined"
                color="error"
                onClick={handleFoul}
              >
                Foul Miss/Pot White
                -4
              </Button>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Reset</Typography>
            <Button
              variant="contained"
              color="warning"
              onClick={handleReset}
            >
              Reset Scores
            </Button>
          </Box>
          
        </Box>
      </Paper>
    </Box>
  );
};

export default SnookerMode;
