import "./guide-figure.css";

const SKIN = '#b97a50'
const SKIN_SHADE = '#a0663f'
const HAIR = '#1b1512'
const JACKET = '#1f6f54'
const JACKET_SHADE = '#185a44'
const TROUSERS = '#1c2733'
const TROUSERS_SHADE = '#151e28'

/** Speech bubble lines hold about 28 characters each. */
const SPEECH = { title: "Hi, I'm your vCISO.", text: "Let's check your controls." };

/**
 * The animated guide character. Holds a still pose under reduced motion.
 * `bust` crops to the upper body with no bubble, for placing against the bottom edge of a card.
 */
export function GuideFigure({ className, bust = false }: { className?: string; bust?: boolean }) {
  return (
    <svg
      viewBox={bust ? "60 15 470 300" : "-70 0 590 615"}
      role="img"
      aria-label={`A cartoon security officer waving hello and holding a large magnifying glass${bust ? "" : `, saying: ${SPEECH.title} ${SPEECH.text}`}`}
      className={className}
      style={{ display: 'block', height: 'auto', overflow: 'visible' }}
    >
      <g>
        {/* Legs */}
        <path d="M228 390 L216 584" stroke={TROUSERS_SHADE} strokeWidth="50" strokeLinecap="round" fill="none" />
        <path d="M292 390 L304 584" stroke={TROUSERS} strokeWidth="50" strokeLinecap="round" fill="none" />
        <path d="M188 612 Q188 584 216 584 L240 584 L240 612 Z" fill="#f2f5f7" />
        <path d="M332 612 Q332 584 304 584 L280 584 L280 612 Z" fill="#f2f5f7" />
        <rect x="184" y="606" width="58" height="9" rx="4" fill="#3df58a" />
        <rect x="278" y="606" width="58" height="9" rx="4" fill="#3df58a" />
      </g>

      <g className="fig-body">
        {/* Waving arm */}
        <g className="fig-wave-arm" style={{ transformOrigin: '192px 226px' }}>
          <path d="M192 226 L136 300" stroke={JACKET_SHADE} strokeWidth="40" strokeLinecap="round" fill="none" />
          <g className="fig-wave-hand" style={{ transformOrigin: '136px 300px' }}>
            <path d="M136 300 L104 220" stroke={JACKET_SHADE} strokeWidth="36" strokeLinecap="round" fill="none" />
            <circle cx="100" cy="196" r="22" fill={SKIN} />
            <path d="M84 182 L78 164 M94 176 L91 156 M106 176 L109 156 M116 183 L124 167" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
          </g>
        </g>

        {/* Torso */}
        <path d="M172 232 Q172 196 214 192 L306 192 Q348 196 348 232 L338 410 Q260 426 182 410 Z" fill={JACKET} />
        <path d="M232 192 L260 258 L288 192 Z" fill="#f2f5f7" />
        <path d="M260 258 L260 416" stroke={JACKET_SHADE} strokeWidth="4" />
        <rect x="180" y="396" width="160" height="16" rx="6" fill={JACKET_SHADE} />

        {/* Lanyard and badge */}
        <path d="M238 196 L260 296 L282 196" stroke="#0b0f14" strokeWidth="5" fill="none" />
        <rect x="236" y="294" width="48" height="58" rx="6" fill="#0b0f14" />
        <g transform="translate(248 304)" fill="#3df58a">
          <path d="M2 4h5.6L15 20H9.4z" />
          <path d="M16.4 4H22l-6.3 13.62-2.8-6.05z" />
        </g>
        <rect x="244" y="339" width="32" height="4" rx="2" fill="#8a96a3" />

        {/* Neck and head */}
        <rect x="238" y="150" width="44" height="52" rx="16" fill={SKIN_SHADE} />
        <g className="fig-head" style={{ transformOrigin: '260px 165px' }}>
          <circle cx="202" cy="108" r="12" fill={SKIN_SHADE} />
          <circle cx="318" cy="108" r="12" fill={SKIN_SHADE} />
          <ellipse cx="260" cy="102" rx="58" ry="66" fill={SKIN} />
          {/* Short curly hair */}
          <g fill={HAIR}>
            <circle cx="208" cy="70" r="20" />
            <circle cx="226" cy="46" r="24" />
            <circle cx="260" cy="34" r="27" />
            <circle cx="295" cy="46" r="24" />
            <circle cx="312" cy="70" r="20" />
            <circle cx="240" cy="62" r="17" />
            <circle cx="278" cy="62" r="17" />
          </g>
          {/* Brows */}
          <path className="fig-brow" d="M226 90 Q238 82 250 89" stroke={HAIR} strokeWidth="6" strokeLinecap="round" fill="none" />
          <path className="fig-brow" d="M270 89 Q282 82 294 90" stroke={HAIR} strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Eyes */}
          <g className="fig-blink" style={{ transformOrigin: '260px 108px' }}>
            <ellipse cx="238" cy="108" rx="11" ry="12" fill="#fff" />
            <ellipse cx="282" cy="108" rx="11" ry="12" fill="#fff" />
            <g className="fig-pupils">
              <circle cx="240" cy="108" r="6.5" fill="#17120f" />
              <circle cx="284" cy="108" r="6.5" fill="#17120f" />
            </g>
          </g>
          {/* Nose and smile */}
          <path d="M260 114 Q254 128 262 130" stroke={SKIN_SHADE} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M238 141 Q260 158 282 141 Z" fill="#fff" stroke="#6e3d24" strokeWidth="3" strokeLinejoin="round" />
        </g>

        {/* Arm with magnifying glass */}
        <g className="fig-scan-arm" style={{ transformOrigin: '328px 226px' }}>
          <path d="M328 226 L388 276" stroke={JACKET_SHADE} strokeWidth="40" strokeLinecap="round" fill="none" />
          <path d="M388 276 L422 206" stroke={JACKET} strokeWidth="36" strokeLinecap="round" fill="none" />
          <path d="M428 190 L442 150" stroke="#3a2a20" strokeWidth="15" strokeLinecap="round" />
          <circle cx="454" cy="98" r="52" fill="#bff5d8" fillOpacity="0.22" stroke="#f2f5f7" strokeWidth="11" />
          <path d="M424 84 Q432 64 454 60" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
          <circle cx="426" cy="194" r="21" fill={SKIN} />
        </g>
      </g>

      {/* Speech is always readable text, never audio. */}
      {!bust && (
        <g className="fig-bubble">
          <path d="M-52 34 Q-52 16 -34 16 H166 Q184 16 184 34 V78 Q184 96 166 96 H150 L176 128 L118 96 H-34 Q-52 96 -52 78 Z" fill="#f2f5f7" stroke="var(--border)" strokeWidth="2" />
          <text x="66" y="49" textAnchor="middle" fontFamily="var(--font-geist-sans), sans-serif" fontSize="19" fontWeight="700" fill="#0b0f14">
            {SPEECH.title}
          </text>
          <text x="66" y="74" textAnchor="middle" fontFamily="var(--font-geist-sans), sans-serif" fontSize="17" fontWeight="500" fill="#26303b">
            {SPEECH.text}
          </text>
        </g>
      )}
    </svg>
  )
}
