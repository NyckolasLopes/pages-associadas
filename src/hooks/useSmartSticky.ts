import { useEffect, useState } from "react";

/** Smart sticky: hide on scroll down, reveal on scroll up. */
export function useSmartSticky(threshold = 80) {
  const [visible, setVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    let ignoreUntil = 0;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const now = Date.now();

        setIsAtTop(y <= threshold);

        if (now > ignoreUntil) {
          if (y < lastY - 3 || y <= threshold) {
            if (!visible) {
              setVisible(true);
              ignoreUntil = now + 400; // Ignore scroll events during the CSS transition
            }
          } else if (y > lastY + 3 && y > threshold) {
            if (visible) {
              setVisible(false);
              ignoreUntil = now + 400; // Ignore scroll events during the CSS transition
            }
          }
        }
        
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    setIsAtTop(window.scrollY <= threshold);
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, visible]);

  return { visible, isAtTop };
}
