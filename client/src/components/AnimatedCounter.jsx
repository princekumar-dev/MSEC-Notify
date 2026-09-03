import { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ value, duration = 800, className = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) return;

    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    prevValue.current = end;

    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return <span className={className}>{display}</span>;
};

export default AnimatedCounter;
