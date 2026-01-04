// Square icon for 1:1 aspect ratio
interface IconProps {
  className?: string;
}

export default function SquareIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
    >
      <defs>
        <linearGradient id="squareIconGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.75)" />
          <stop offset="100%" stopColor="rgba(64, 64, 64, 0.75)" />
        </linearGradient>
      </defs>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M19 2h-14a3 3 0 0 0 -3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3 -3v-14a3 3 0 0 0 -3 -3z" fill="url(#squareIconGradient)" />
    </svg>
  );
}
