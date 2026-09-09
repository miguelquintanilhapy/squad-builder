import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'SquadBuilder — Descreva seu projeto. Monte o squad ideal.'

/** Card exibido quando o link é compartilhado (WhatsApp, Slack, X, iMessage etc.) — mesma marca e
 * paleta do app (globals.css), sem depender de fonte customizada (o gerador não tem acesso às
 * fontes do Google Fonts carregadas no app real, então usa a stack padrão do sistema). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 90px',
          background: '#f7f8fa',
        }}
      >
        <svg width="120" height="120" viewBox="1 3 22 22" style={{ marginBottom: 28 }}>
          <rect x="1" y="3" width="22" height="22" rx="5" fill="#ffffff" />
          <path d="M4 17 A8 8 0 0 1 20 17" fill="none" stroke="#c6cdd4" strokeWidth={2.4} strokeLinecap="round" />
          <line x1="12" y1="17" x2="8.4" y2="10.5" stroke="#2c7458" strokeWidth={2.8} strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.8" fill="#18212a" />
        </svg>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, color: '#18212a', letterSpacing: '-0.03em' }}>
          SquadBuilder
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 34, color: '#636d78', maxWidth: 880 }}>
          Descreva seu projeto. Monte o <span style={{ color: '#14584a', fontWeight: 700 }}>squad</span> ideal.
        </div>
      </div>
    ),
    { ...size }
  )
}
