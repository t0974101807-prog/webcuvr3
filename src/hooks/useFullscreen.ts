import { useState, useEffect, RefObject } from 'react';

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVirtualFullscreen, setIsVirtualFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement === ref.current ||
        (document as any).webkitFullscreenElement === ref.current ||
        (document as any).mozFullScreenElement === ref.current ||
        (document as any).msFullscreenElement === ref.current;
      setIsFullscreen(!!isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        setIsVirtualFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [ref]);

  const toggleFullscreen = async () => {
    if (!ref.current) return;

    try {
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).mozFullScreenElement && 
          !(document as any).msFullscreenElement) {
        
        // Try native standard fullscreen
        const elem = ref.current;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        } else {
          // Fallback to virtual CSS fullscreen if not supported
          setIsVirtualFullscreen(true);
        }
      } else {
        // Exit native fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsVirtualFullscreen(false);
      }
    } catch (err) {
      console.warn('Native Fullscreen failed, falling back to CSS Virtual Fullscreen mode.', err);
      // Seamlessly toggle Virtual Fullscreen as a bulletproof fallback (e.g. under standard iframe sandbox)
      setIsVirtualFullscreen(prev => !prev);
    }
  };

  return { 
    isFullscreen: isFullscreen || isVirtualFullscreen, 
    toggleFullscreen,
    isVirtualFullscreen,
    virtualClass: isVirtualFullscreen 
      ? "fixed inset-0 z-[9999] w-screen h-screen overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col space-y-4 animate-in fade-in duration-300" 
      : ""
  };
}
