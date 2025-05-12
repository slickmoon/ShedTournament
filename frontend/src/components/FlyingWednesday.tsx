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
          if (prevTexts.length < 8) {
            canAddText.current = false;
            // Reset the flag after 1-2 seconds
            setTimeout(() => {
              canAddText.current = true;
            }, 50 + Math.random() * 300); // Random delay between 0.05 and 0.3 seconds

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
            color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`,
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