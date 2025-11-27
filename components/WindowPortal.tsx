
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface WindowPortalProps {
  children: React.ReactNode;
  closeWindowPortal: () => void;
  title?: string;
}

const WindowPortal: React.FC<WindowPortalProps> = ({ children, closeWindowPortal, title = 'Mini Window' }) => {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [externalWindow, setExternalWindow] = useState<Window | null>(null);

  useEffect(() => {
    const openWindow = async () => {
      let win: Window | null = null;

      // 1. Try Document Picture-in-Picture API
      if ('documentPictureInPicture' in window) {
        try {
          // @ts-ignore
          win = await window.documentPictureInPicture.requestWindow({ width: 800, height: 600 });
        } catch (err) {
          console.log("PiP failed, falling back to window.open", err);
        }
      }

      // 2. Fallback to standard popup
      if (!win) {
        win = window.open('', '', 'width=800,height=600,left=200,top=200,menubar=no,toolbar=no,location=no,status=no');
      }

      if (win) {
        setExternalWindow(win);
        win.document.title = title;

        // Copy styles
        const copyStyle = (url: string) => {
            const link = win!.document.createElement('link');
            link.href = url;
            link.rel = "stylesheet";
            win!.document.head.appendChild(link);
        };
        const copyScript = (url: string) => {
            const script = win!.document.createElement('script');
            script.src = url;
            win!.document.head.appendChild(script);
        };

        copyScript("https://cdn.tailwindcss.com");
        copyStyle("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

        win.document.body.className = "bg-slate-50 text-slate-900 font-sans p-4 h-screen flex flex-col";
        
        const el = win.document.createElement('div');
        el.className = "h-full w-full flex flex-col";
        win.document.body.appendChild(el);
        setContainerEl(el);

        const handleClose = () => closeWindowPortal();
        win.addEventListener('pagehide', handleClose);
        
        // Polling as a fallback to detect closure
        const checkClosed = setInterval(() => {
            if (win!.closed) {
                clearInterval(checkClosed);
                handleClose();
            }
        }, 500);
      }
    };

    openWindow();

    return () => {
      if (externalWindow && !externalWindow.closed) externalWindow.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!containerEl) return null;
  return ReactDOM.createPortal(children, containerEl);
};

export default WindowPortal;
