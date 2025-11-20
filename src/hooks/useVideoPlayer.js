// hooks/useVideoPlayer.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useVideoPlayer = (centerIdx) => {
  const centerVideoRef = useRef(null);
  const [isCenterPlaying, setIsCenterPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const handlePlayPause = useCallback(() => {
    if (!centerVideoRef.current) return;

    if (isCenterPlaying) {
      centerVideoRef.current.pause();
    } else {
      const playPromise = centerVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Autoplay error:', err);
        });
      }
    }
  }, [isCenterPlaying]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(m => !m);
    if (centerVideoRef.current) {
      centerVideoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  const handleProgressChange = useCallback((value) => {
    const val = Number(value);
    setProgress(val);
    if (centerVideoRef.current) {
      centerVideoRef.current.currentTime = val;
    }
  }, []);

  // Handle play/pause events
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;

    const handlePause = () => {
      setIsCenterPlaying(false);
    };

    const handlePlay = () => {
      setIsCenterPlaying(true);
    };

    const handleEnded = () => {
      setIsCenterPlaying(false);
    };

    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [centerIdx]);

  // Handle video progress
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [centerIdx]);

  // Pause when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && isCenterPlaying && centerVideoRef.current) {
          centerVideoRef.current.pause();
        }
      },
      { threshold: 0.5 }
    );

    if (centerVideoRef.current) {
      observer.observe(centerVideoRef.current);
    }

    return () => {
      if (centerVideoRef.current) {
        observer.unobserve(centerVideoRef.current);
      }
    };
  }, [isCenterPlaying]);

  // Pause video when index changes
  useEffect(() => {
    if (centerVideoRef.current) {
      centerVideoRef.current.pause();
      centerVideoRef.current.currentTime = 0;
    }
    setIsCenterPlaying(false);
    setProgress(0);
  }, [centerIdx]);

  return {
    centerVideoRef,
    isCenterPlaying,
    isMuted,
    progress,
    duration,
    showControls,
    setShowControls,
    handlePlayPause,
    handleMuteToggle,
    handleProgressChange
  };
};