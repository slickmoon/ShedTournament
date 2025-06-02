import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';

interface PlayerDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, elo: number, access_password: string) => void;
  player?: {
    id: number;
    name: string;
    elo_rating: number;
  } | null;
}

const PlayerDialog: React.FC<PlayerDialogProps> = ({
  open,
  onClose,
  onSave,
  player
}) => {
  const [name, setName] = useState('');
  const [elo, setElo] = useState(1000);
  const [accessPassword, setAccessPassword] = useState('');

  useEffect(() => {
    if (player) {
      setName(player.name);
      setElo(player.elo_rating);
    } else {
      setName('');
      setElo(1000);
    }
    setAccessPassword('');
  }, [player]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, elo, accessPassword);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {player ? 'Edit Player' : 'Add New Player'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="ELO Rating"
              type="number"
              value={elo}
              onChange={(e) => setElo(Number(e.target.value))}
              required
              fullWidth
            />
            {player && (
              <TextField
                label="Access Password"
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                required
                fullWidth
                helperText="Required for editing player"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {player ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PlayerDialog; 