import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { scrabbleWords } from '../data/scrabble_words.ts';

const ScrabbleGame: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [scrambledWord, setScrambledWord] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Function to scramble a word
  const scrambleWord = (word: string): string => {
    const characters = word.split('');
    for (let i = characters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [characters[i], characters[j]] = [characters[j], characters[i]];
    }
    return characters.join('');
  };

  // Function to get a new random word
  const getNewWord = () => {
    const randomWord = scrabbleWords[Math.floor(Math.random() * scrabbleWords.length)];
    setCurrentWord(randomWord);
    setScrambledWord(scrambleWord(randomWord));
    setIsRevealed(false);
  };

  // Initialize with a random word
  useEffect(() => {
    getNewWord();
  }, []);

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
        Wednesday Scrabble Challenge
      </Typography>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          maxWidth: 400, 
          mx: 'auto',
          textAlign: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            mb: 2,
            fontFamily: 'monospace',
            letterSpacing: 2,
            color: isRevealed ? 'success.main' : 'text.primary'
          }}
        >
          {isRevealed ? currentWord : scrambledWord}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color={isRevealed ? "secondary" : "primary"}
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {isRevealed ? 'Scramble Again' : 'Reveal Word'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={getNewWord}
          >
            New Word
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ScrabbleGame; 