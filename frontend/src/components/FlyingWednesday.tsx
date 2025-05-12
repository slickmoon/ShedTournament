import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface FlyingText {
  id: number;
  y: number;
  x: number;
}

const FlyingWednesday: React.FC = () => {
  const [flyingTexts, setFlyingTexts] = useState<FlyingText[]>([]);
  const canAddText = useRef(true);

  useEffect(() => {
    // Create initial flying texts
    const initialTexts = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      y: Math.random() * window.innerHeight,
      x: -200 // Start off-screen
    }));
    setFlyingTexts(initialTexts);

    // Animation interval for moving texts
    const moveInterval = setInterval(() => {
      setFlyingTexts(prevTexts => {
        return prevTexts.map(text => ({
          ...text,
          x: text.x + 30, // Move right
          y: text.y + (Math.random() - 0.5) * 2 // Slight vertical movement
        })).filter(text => text.x < window.innerWidth + 200); // Remove texts that have moved off-screen
      });
    }, 50);

    // Text generation interval
    const generateInterval = setInterval(() => {
      if (canAddText.current) {
        setFlyingTexts(prevTexts => {
          if (prevTexts.length < 3) {
            canAddText.current = false;
            // Reset the flag after 1-2 seconds
            setTimeout(() => {
              canAddText.current = true;
            }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds

            return [
              ...prevTexts,
              {
                id: Date.now(),
                y: Math.random() * window.innerHeight,
                x: -200
              }
            ];
          }
          return prevTexts;
        });
      }
    }, 100); // Check every 100ms if we can add a new text

    return () => {
      clearInterval(moveInterval);
      clearInterval(generateInterval);
    };
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
          wednesday
        </Typography>
      ))}
    </Box>
  );
};

export default FlyingWednesday; 