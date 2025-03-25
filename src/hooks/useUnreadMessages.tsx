
import { useState, useEffect, useCallback } from 'react';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationAudio, setNotificationAudio] = useState<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element for notification sound
    const audio = new Audio('/notification.mp3');
    setNotificationAudio(audio);
    
    return () => {
      // Cleanup
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);
  
  const playNotificationSound = useCallback(() => {
    if (notificationAudio) {
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch(error => {
        // User interaction is required to play audio on some browsers
        console.log('Audio playback error (user may need to interact with the page first):', error);
      });
    }
  }, [notificationAudio]);
  
  const increaseUnreadCount = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);
  
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);
  
  return {
    unreadCount,
    playNotificationSound,
    increaseUnreadCount,
    resetUnreadCount,
  };
};
