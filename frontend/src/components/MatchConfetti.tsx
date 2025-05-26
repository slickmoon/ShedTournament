import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface MatchConfettiProps {
  onComplete: () => void;
}

const MatchConfetti: React.FC<MatchConfettiProps> = ({ onComplete }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // Stop confetti after 3 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {/* Left cannon */}
      <div style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: windowSize.width / 2,
        height: windowSize.height,
        transform: 'rotate(180deg)',
        pointerEvents: 'none',
      }}>
        <Confetti
          width={windowSize.width / 2}
          height={windowSize.height}
          numberOfPieces={100}
          gravity={0.4}
          initialVelocityY={10}
          initialVelocityX={-5}
          recycle={false}
        />
      </div>
      {/* Right cannon */}
      <div style={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        width: windowSize.width / 2,
        height: windowSize.height,
        transform: 'rotate(180deg)',
        pointerEvents: 'none',
      }}>
        <Confetti
          width={windowSize.width / 2}
          height={windowSize.height}
          numberOfPieces={100}
          gravity={0.4}
          initialVelocityY={10}
          initialVelocityX={5}
          recycle={false}
        />
      </div>
    </>
  );
};

export default MatchConfetti; 