// HypurrFi Paw Icon
export function HypurrPaw({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main pad */}
      <ellipse cx="12" cy="14.5" rx="5" ry="4.5" />
      {/* Top left toe */}
      <ellipse cx="6.5" cy="8" rx="2.2" ry="2.8" />
      {/* Top right toe */}
      <ellipse cx="17.5" cy="8" rx="2.2" ry="2.8" />
      {/* Middle left toe */}
      <ellipse cx="8.5" cy="5" rx="1.8" ry="2.5" />
      {/* Middle right toe */}
      <ellipse cx="15.5" cy="5" rx="1.8" ry="2.5" />
    </svg>
  );
}
