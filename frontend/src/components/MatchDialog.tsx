import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Select, MenuItem } from '@mui/material';

interface Player {
  id: number;
  player_name: string;
  elo: number;
}

interface MatchDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordMatch: () => void;
  players: Player[];
  isDoubles: boolean;
  setIsDoubles: (isDoubles: boolean) => void;
  winner: string;
  setWinner: (winner: string) => void;
  loser: string;
  setLoser: (loser: string) => void;
  winner2: string;
  setWinner2: (winner2: string) => void;
  loser2: string;
  setLoser2: (loser2: string) => void;
  matchError: string;
  isLoading?: boolean;
}

const MatchDialog: React.FC<MatchDialogProps> = ({
  open,
  onClose,
  onRecordMatch,
  players,
  isDoubles,
  setIsDoubles,
  winner,
  setWinner,
  loser,
  setLoser,
  winner2,
  setWinner2,
  loser2,
  setLoser2,
  matchError,
  isLoading = false
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Record Match Outcome</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>Match Type:</Typography>
            <Button
              variant={isDoubles ? "contained" : "outlined"}
              onClick={() => setIsDoubles(true)}
            >
              Doubles
            </Button>
            <Button
              variant={!isDoubles ? "contained" : "outlined"}
              onClick={() => setIsDoubles(false)}
            >
              Singles
            </Button>
          </Box>

          <Box>
            <Typography variant="h6">Winners</Typography>
            <Select
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
              label="Winner 1"
              fullWidth
              sx={{ mb: 2 }}
            >
              {players.map((player) => (
                <MenuItem key={player.id} value={player.player_name}>
                  {player.player_name}
                </MenuItem>
              ))}
            </Select>
            {isDoubles && (
              <Select
                value={winner2}
                onChange={(e) => setWinner2(e.target.value)}
                label="Winner 2"
                fullWidth
              >
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.player_name}>
                    {player.player_name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>

          <Box>
            <Typography variant="h6">Losers</Typography>
            <Select
              value={loser}
              onChange={(e) => setLoser(e.target.value)}
              label="Loser 1"
              fullWidth
              sx={{ mb: 2 }}
            >
              {players.map((player) => (
                <MenuItem key={player.id} value={player.player_name}>
                  {player.player_name}
                </MenuItem>
              ))}
            </Select>
            {isDoubles && (
              <Select
                value={loser2}
                onChange={(e) => setLoser2(e.target.value)}
                label="Loser 2"
                fullWidth
              >
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.player_name}>
                    {player.player_name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button onClick={onRecordMatch} variant="contained" disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Match'}
        </Button>
      </DialogActions>
      {matchError && (
        <Typography variant="h6" sx={{ mt: 2, color: 'red', px: 2, pb: 2 }}>
          {matchError}
        </Typography>
      )}
    </Dialog>
  );
};

export default MatchDialog; 