import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Nestar Homes Real Estate Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#38bdf8',
            marginBottom: 20,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Nestar Homes Uganda
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#ffffff',
            lineHeight: 1.2,
            maxWidth: '900px',
          }}
        >
          Verified Residential Property & Apartment Rentals
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
