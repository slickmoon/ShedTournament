import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const BouncingText = styled.div`
  position: fixed;
  font-size: 2rem;
  font-weight: bold;
  color: rgba(255, 215, 0, 0.2);
  pointer-events: none;
  user-select: none;
  z-index: -1;
`;

const BouncingWednesday: React.FC = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 2, y: 2 });

  const resetPosition = () => {
    if (!textRef.current) return;
    positionRef.current = { x: 0, y: 0 };
    textRef.current.style.transform = 'translate(0px, 0px)';
  };

  useEffect(() => {
    const animate = () => {
      if (!textRef.current) return;

      const text = textRef.current;
      const rect = text.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Update position
      positionRef.current.x += velocityRef.current.x;
      positionRef.current.y += velocityRef.current.y;

      // Bounce off walls
      if (positionRef.current.x <= 0 || positionRef.current.x + rect.width >= windowWidth) {
        velocityRef.current.x *= -1;
      }
      if (positionRef.current.y <= 0 || positionRef.current.y + rect.height >= windowHeight) {
        velocityRef.current.y *= -1;
      }

      // Apply position
      text.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    // Add resize event listener
    window.addEventListener('resize', resetPosition);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resetPosition);
    };
  }, []);

  return (
    <BouncingText ref={textRef}>
      wednesday
    </BouncingText>
  );
};

export default BouncingWednesday; 