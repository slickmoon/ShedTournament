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
  const [isFading, setIsFading] = useState(false);

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
    // Start fading out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // Complete the effect after 3 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
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
        pointerEvents: 'none',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}>
        <Confetti
          width={windowSize.width / 2}
          height={windowSize.height}
          numberOfPieces={150}
          gravity={0.4}
          initialVelocityY={-10}
          initialVelocityX={5}
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
        pointerEvents: 'none',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}>
        <Confetti
          width={windowSize.width / 2}
          height={windowSize.height}
          numberOfPieces={150}
          gravity={0.4}
          initialVelocityY={-10}
          initialVelocityX={-5}
          recycle={false}
        />
      </div>
    </>
  );
};

export default MatchConfetti; 