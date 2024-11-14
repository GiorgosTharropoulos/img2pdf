export function Logo(props: React.HTMLAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" {...props}>
      <rect
        x="20"
        y="30"
        width="70"
        height="100"
        rx="8"
        fill="#4f46e5"
        filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
      />

      <circle cx="45" cy="55" r="10" fill="#fff" />
      <path d="M20 110 L45 80 L65 95 L90 70 L90 122 L20 122 Z" fill="#818cf8" />

      <path
        d="M110 80 L130 80 M130 80 L120 70 M130 80 L120 90"
        stroke="#374151"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="150"
        y="30"
        width="70"
        height="100"
        rx="8"
        fill="#dc2626"
        filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
      />

      <path
        d="M165 45 h40 M165 65 h40 M165 85 h25"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />

      <text
        x="165"
        y="115"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="18"
        fill="#ffffff"
      >
        PDF
      </text>
    </svg>
  );
}
