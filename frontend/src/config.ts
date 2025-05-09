// Get the base path from the window location or default to /shed
const getBasePath = () => {
  const baseHref = document.querySelector('base')?.getAttribute('href') || '/shed/';
  return baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref;
};

export const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';
export const BASE_PATH = getBasePath(); 