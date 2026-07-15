import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt =
  'DC Neighborhoods: draw your neighborhood boundary on the map'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '72px 80px',
        }}
      >
        {/* Text block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            paddingRight: '48px',
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: '#2563eb',
              marginBottom: 20,
            }}
          >
            DC Neighborhoods
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.1,
              marginBottom: 28,
            }}
          >
            Where does your neighborhood end?
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#4b5563',
              lineHeight: 1.4,
              marginBottom: 36,
            }}
          >
            Draw your boundary on the map. See how your neighbors draw theirs.
          </div>
          <div style={{ fontSize: 26, color: '#9ca3af' }}>
            dc-neighborhoods.vercel.app
          </div>
        </div>

        {/* Stylized boundary drawing */}
        <svg width="380" height="380" viewBox="0 0 380 380">
          <polygon
            points="80,70 320,110 290,320 60,270"
            fill="rgba(37, 99, 235, 0.12)"
            stroke="#2563eb"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <circle cx="320" cy="110" r="14" fill="#ffffff" />
          <circle cx="320" cy="110" r="10" fill="#2563eb" />
          <circle cx="290" cy="320" r="14" fill="#ffffff" />
          <circle cx="290" cy="320" r="10" fill="#2563eb" />
          <circle cx="60" cy="270" r="14" fill="#ffffff" />
          <circle cx="60" cy="270" r="10" fill="#2563eb" />
          <circle cx="80" cy="70" r="16" fill="#ffffff" />
          <circle cx="80" cy="70" r="12" fill="#16a34a" />
        </svg>
      </div>
    ),
    size
  )
}
