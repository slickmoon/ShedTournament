import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface FlyingText {
  id: number;
  y: number;
  x: number;
}

const FlyingWednesday: React.FC = () => {
  const [flyingTexts, setFlyingTexts] = useState<FlyingText[]>([]);

  useEffect(() => {
    // Create initial flying texts
    const initialTexts = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      y: Math.random() * window.innerHeight,
      x: -200 // Start off-screen
    }));
    setFlyingTexts(initialTexts);

    // Animation interval
    const interval = setInterval(() => {
      setFlyingTexts(prevTexts => {
        return prevTexts.map(text => ({
          ...text,
          x: text.x + 2, // Move right
          y: text.y + (Math.random() - 0.5) * 2 // Slight vertical movement
        })).filter(text => text.x < window.innerWidth + 200); // Remove texts that have moved off-screen
      });

      // Add new text if we have less than 5
      if (flyingTexts.length < 5) {
        setFlyingTexts(prevTexts => [
          ...prevTexts,
          {
            id: Date.now(),
            y: Math.random() * window.innerHeight,
            x: -200
          }
        ]);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      {flyingTexts.map(text => (
        <Typography
          key={text.id}
          sx={{
            position: 'absolute',
            left: text.x,
            top: text.y,
            color: 'rgba(255, 215, 0, 0.2)', // Semi-transparent gold
            fontSize: '2rem',
            fontWeight: 'bold',
            transform: 'rotate(-15deg)',
            whiteSpace: 'nowrap',
            userSelect: 'none'
          }}
        >
          Wednesday
        </Typography>
      ))}
    </Box>
  );
};

export default FlyingWednesday; 