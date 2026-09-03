import { useState, useEffect } from 'react';
import { FiChevronUp } from 'react-icons/fi';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-5 z-40 w-11 h-11 rounded-xl bg-white border border-mint-300 text-teal-700 shadow-lg hover:shadow-xl hover:bg-mint-50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center cursor-pointer"
      aria-label="Scroll to top"
    >
      <FiChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
};

export default BackToTop;
