const HighlightText = ({ text, searchTerm, className = '' }) => {
  if (!searchTerm || !text) return <span className={className}>{text}</span>;

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200 text-amber-900 rounded px-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default HighlightText;
