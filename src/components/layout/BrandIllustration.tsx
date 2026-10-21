// Brand art: ID card + shield, ringed by the places a Ladder ID can be used.
// Used by the Welcome hero and the desktop BrandPanel. Decorative only; colours come from globals.css tokens.
import { cn } from '@/lib/utils/cn';

const ORBIT_ICON_CLASSES = 'fill-white/15 stroke-white/25';

function OrbitBadge({ cx, cy, children }: { cx: number; cy: number; children: React.ReactNode }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="28" className={ORBIT_ICON_CLASSES} strokeWidth="1" />
      <g
        transform={`translate(${cx - 12} ${cy - 12})`}
        fill="none"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </g>
  );
}

const BankIcon = () => (
  <>
    <path d="M3 9.5 12 4l9 5.5" />
    <path d="M4.5 9.5h15" />
    <path d="M6.5 12v6M10 12v6M14 12v6M17.5 12v6" />
    <path d="M4 20.5h16" />
  </>
);

const CardIcon = () => (
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
  </>
);

const PhoneIcon = () => (
  <>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
    <path d="M12 18h.01" />
  </>
);

const Diamond = ({ x, y }: { x: number; y: number }) => (
  <rect
    x={x - 4}
    y={y - 4}
    width="8"
    height="8"
    transform={`rotate(45 ${x} ${y})`}
    className="fill-mint-300/80"
  />
);

export function BrandIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 316 230"
      className={cn('h-auto w-full max-w-[316px]', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="brand-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-mint-100)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--color-mint-300)" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="brand-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--color-mint-300)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-mint-300)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="112" rx="130" ry="100" fill="url(#brand-glow)" />

      {/* Orbit */}
      <path
        d="M30 94C28 42 120 8 210 7c72-1 92 52 77 127-10 52-48 84-112 84-64 0-112-14-138-46-18-22-6-48-7-78Z"
        fill="none"
        className="stroke-mint-300/45"
        strokeWidth="1.2"
      />

      {/* ID card */}
      <rect x="77" y="50" width="157" height="101" rx="8" fill="url(#brand-card)" />
      <rect
        x="77"
        y="50"
        width="157"
        height="101"
        rx="8"
        fill="none"
        className="stroke-mint-100/70"
        strokeWidth="1.5"
      />
      <rect x="93" y="73" width="35" height="40" rx="4" className="fill-brand-500/35" />
      <circle cx="110.5" cy="86" r="7" className="fill-brand-500/80" />
      <path d="M97 113c1-10 6.5-15 13.5-15s12.5 5 13.5 15Z" className="fill-brand-500/80" />
      <rect x="136" y="76" width="38" height="7" rx="3.5" className="fill-brand-500/35" />
      <rect x="136" y="92" width="60" height="7" rx="3.5" className="fill-brand-500/30" />
      <rect x="95" y="123" width="68" height="6" rx="3" className="fill-brand-500/25" />

      {/* Shield */}
      <path
        d="M199 103l31 11v24c0 20-13 33-31 40-18-7-31-20-31-40v-24Z"
        className="fill-brand-500 stroke-mint-100/80"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="m186 140 9 9 18-19"
        fill="none"
        className="stroke-mint-100"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <OrbitBadge cx={32} cy={71}>
        <BankIcon />
      </OrbitBadge>
      <OrbitBadge cx={283} cy={29}>
        <CardIcon />
      </OrbitBadge>
      <OrbitBadge cx={53} cy={179}>
        <CardIcon />
      </OrbitBadge>
      <OrbitBadge cx={272} cy={200}>
        <PhoneIcon />
      </OrbitBadge>

      <Diamond x={208} y={10} />
      <Diamond x={280} y={121} />
      <Diamond x={109} y={203} />
    </svg>
  );
}
