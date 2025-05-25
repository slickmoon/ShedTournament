import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
`;

interface SpecialMatchGraphicProps {
  message: string;
  color: string;
  onComplete: () => void;
}

const SpecialMatchGraphic: React.FC<SpecialMatchGraphicProps> = ({ message, color, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 2100); // 100ms fade in + 1000ms display

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        zIndex: 1000,
        animation: isVisible 
          ? `${fadeIn} 100ms ease-out forwards`
          : `${fadeOut} 300ms ease-in forwards`,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 2,
        padding: 3,
        textAlign: 'center',
        minWidth: '200px'
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: color,
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default SpecialMatchGraphic; 