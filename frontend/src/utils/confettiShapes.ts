// Custom confetti shapes using emojis
const shapes = ['🎱'];

export const drawCustomConfetti = (ctx: CanvasRenderingContext2D) => {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 20 + 10; // Random size between 10 and 30
  
  ctx.font = `${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shape, 0, 0);
};

// Alternative version using images
export const drawImageConfetti = (ctx: CanvasRenderingContext2D) => {
  const size = Math.random() * 20 + 10;
  const image = new Image();
  
  // You can replace these with your own image paths
  const images = [
    '/confetti/eightball.png',
    '/confetti/trophy.png',
    '/confetti/star.png',
    '/confetti/target.png',
    '/confetti/palette.png'
  ];
  
  const randomImage = images[Math.floor(Math.random() * images.length)];
  image.src = randomImage;
  
  // Draw the image centered
  ctx.drawImage(image, -size/2, -size/2, size, size);
}; 