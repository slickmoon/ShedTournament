import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface FlyingText {
  id: number;
  y: number;
  x: number;
  initialDelay: number;
  isMoving: boolean;
}

const FlyingWednesday: React.FC = () => {
  const [flyingTexts, setFlyingTexts] = useState<FlyingText[]>(() => {
    // Initialize with 20 texts, each with a random initial delay
    return Array.from({ length: 20 }, (_, index) => ({
      id: index,
      y: Math.random() * window.innerHeight,
      x: -200,
      initialDelay: Math.random() * 2000, // Random delay between 0-2 seconds
      isMoving: false
    }));
  });

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Start the timer
    startTimeRef.current = Date.now();
    
    const checkDelays = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTimeRef.current;

      setFlyingTexts(prevTexts => 
        prevTexts.map(text => ({
          ...text,
          isMoving: text.initialDelay <= elapsedTime
        }))
      );

      // Stop the timer after 5 seconds
      if (elapsedTime >= 5000) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      timerRef.current = window.setTimeout(checkDelays, 16); // ~60fps
    };

    checkDelays();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Animation interval for moving texts
    const moveInterval = setInterval(() => {
      setFlyingTexts(prevTexts => {
        return prevTexts.map(text => {
          if (!text.isMoving) return text;

          const newX = text.x + 30; // Move right
          const newY = text.y + (Math.random() - 0.5) * 2; // Slight vertical movement

          // If text goes off screen, reset it to the left with new random height
          if (newX > window.innerWidth + 200) {
            return {
              ...text,
              x: -200,
              y: Math.random() * window.innerHeight
            };
          }

          return {
            ...text,
            x: newX,
            y: newY
          };
        });
      });
    }, 50);

    return () => {
      clearInterval(moveInterval);
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
        overflow: 'hidden',
        willChange: 'transform',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          willChange: 'transform',
        }}
      >
        {flyingTexts.map(text => (
          <Typography
            key={text.id}
            sx={{
              position: 'absolute',
              transform: `translate3d(${text.x}px, ${text.y}px, 0) rotate(-15deg)`,
              color: 'rgba(255, 215, 0, 0.2)',
              fontSize: '2rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              opacity: text.isMoving ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            wednesday
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default FlyingWednesday; 