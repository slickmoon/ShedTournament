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
      initialDelay: Math.random() * 5000, // Random delay between 0-5 seconds
      isMoving: false
    }));
  });

  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Start the timer
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTimeRef.current;

      setFlyingTexts(prevTexts => {
        const newTexts = prevTexts.map(text => {
          // Check if this text should start moving
          if (!text.isMoving && text.initialDelay <= elapsedTime) {
            return { ...text, isMoving: true };
          }

          // Only update position if the text is moving
          if (text.isMoving) {
            const newX = text.x + 30;
            const newY = text.y + (Math.random() - 0.5) * 2;

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
          }

          return text;
        });

        return newTexts;
      });

      // Continue animation if any texts are still waiting to start or are moving
      if (elapsedTime < 5000 || flyingTexts.some(text => text.isMoving)) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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