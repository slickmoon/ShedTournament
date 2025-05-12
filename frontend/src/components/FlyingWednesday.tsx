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
  const timeoutsRef = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation interval for moving texts
    const moveInterval = setInterval(() => {
      setFlyingTexts(prevTexts => {
        const newTexts = prevTexts.map(text => ({
          ...text,
          x: text.x + 30, // Move right
          y: text.y + (Math.random() - 0.5) * 2 // Slight vertical movement
        }));

        // Only keep texts that are within a reasonable range
        return newTexts.filter(text => {
          const isOffScreen = text.x > window.innerWidth + 200;
          return !isOffScreen;
        });
      });
    }, 50);

    // Text generation interval
    const generateInterval = setInterval(() => {
      if (canAddText.current) {
        setFlyingTexts(prevTexts => {
          if (prevTexts.length < 20) {
            canAddText.current = false;
            const timeoutId = window.setTimeout(() => {
              canAddText.current = true;
            }, 50 + Math.random() * 300);
            
            timeoutsRef.current.push(timeoutId);

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
    }, 100);

    return () => {
      clearInterval(moveInterval);
      clearInterval(generateInterval);
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  return (
    <Box
      ref={containerRef}
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