import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Ícone pra "adicionar à tela de início" no iOS — mesma marca do favicon (icon.svg) e do header
 * (BrandMark.tsx), só maior e com fundo sólido (o iOS não aceita transparência aqui, cobriria com
 * preto). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <svg width="132" height="132" viewBox="1 3 22 22">
          <path d="M4 17 A8 8 0 0 1 20 17" fill="none" stroke="#c6cdd4" strokeWidth={2.4} strokeLinecap="round" />
          <line x1="12" y1="17" x2="8.4" y2="10.5" stroke="#2c7458" strokeWidth={2.8} strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.8" fill="#18212a" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
