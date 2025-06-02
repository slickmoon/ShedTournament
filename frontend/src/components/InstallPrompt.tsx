import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      console.log('App is already installed');
      return;
    }

    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    // Check if the event has already fired
    const checkPrompt = async () => {
      const promptEvent = (window as any).deferredPrompt;
      if (promptEvent) {
        console.log('Found existing deferred prompt');
        setDeferredPrompt(promptEvent);
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkPrompt();

    // Show iOS prompt if it's an iOS device
    if (isIOSDevice) {
      console.log('iOS device detected');
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    try {
      console.log('Prompting for installation');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store in localStorage to not show again
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if user has dismissed before
  if (!isVisible || localStorage.getItem('installPromptDismissed') === 'true') return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        p: 2,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2
      }}
    >
      <PhoneIphoneIcon color="primary" sx={{ fontSize: 32 }} />
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Install Shed Tournament
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isIOS
            ? 'Add this app to your home screen for quick access'
            : 'Install this app on your device for quick access'}
        </Typography>
      </Box>
      {isIOS ? (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsVisible(false)}
        >
          How to Install
        </Button>
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={handleInstall}
        >
          Install
        </Button>
      )}
      <IconButton
        size="small"
        onClick={handleDismiss}
        sx={{ ml: 1 }}
      >
        <CloseIcon />
      </IconButton>
    </Paper>
  );
};

export default InstallPrompt; 