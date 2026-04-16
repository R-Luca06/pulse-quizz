import { forwardRef } from 'react'
import type { GameMode, Difficulty, Category, QuestionResult } from '../../types/quiz'
import { computeBestStreak } from '../../utils/statsStorage'

const NORMAL_TIERS = [
  { min: 10, label: 'Parfait !',         color: '#EAB308' },
  { min: 7,  label: 'Impressionnant !',  color: '#8B5CF6' },
  { min: 4,  label: 'Pas mal !',         color: '#3B82F6' },
  { min: 0,  label: 'Retente ta chance', color: '#6B7280' },
]

const COMP_TIERS = [
  { min: 2000, label: 'Légendaire',   color: '#EAB308' },
  { min: 1000, label: 'Élite',        color: '#8B5CF6' },
  { min: 500,  label: 'Compétiteur',  color: '#F97316' },
  { min: 0,    label: 'Débutant',     color: '#6B7280' },
]

interface Props {
  score: number
  results: QuestionResult[]
  gameMode: GameMode
  difficulty: Difficulty
  category: Category
  username: string | null
  userRank?: number | null
}

const ScoreCard = forwardRef<HTMLDivElement, Props>(function ScoreCard(
  { score, results, gameMode, username, userRank },
  ref
) {
  const isCompetitif = gameMode === 'compétitif'
  const tiers = isCompetitif ? COMP_TIERS : NORMAL_TIERS
  const tier = tiers.find(t => score >= t.min) ?? tiers[tiers.length - 1]
  const accent = tier.color

  const correct = results.filter(r => r.isCorrect).length
  const wrong = results.filter(r => !r.isCorrect && r.userAnswer !== null).length
  const timeout = results.filter(r => r.userAnswer === null).length
  const bestStreak = computeBestStreak(results)

  const bgColor = isCompetitif ? '#120a05' : '#0f0f1c'
  const borderColor = isCompetitif ? 'rgba(249,115,22,0.22)' : 'rgba(139,92,246,0.22)'
  const modePillBg = isCompetitif ? 'rgba(249,115,22,0.12)' : 'rgba(139,92,246,0.12)'
  const modePillBorder = isCompetitif ? 'rgba(249,115,22,0.25)' : 'rgba(139,92,246,0.25)'
  const modePillColor = isCompetitif ? 'rgba(251,146,60,0.85)' : 'rgba(167,139,250,0.85)'
  const modeLabel = isCompetitif ? '🔥 Compétitif' : 'Normal'
  const ctaText = isCompetitif ? 'Peux-tu me battre ?' : 'Peux-tu faire mieux ?'

  const stats = [
    { val: correct,         label: 'Correct',  color: '#34D399' },
    { val: wrong,           label: 'Faux',     color: '#F87171' },
    { val: timeout,         label: 'Timeout',  color: 'rgba(255,255,255,0.38)' },
    { val: `${bestStreak}×`, label: 'Série',   color: '#FBBF24' },
  ]

  return (
    <div
      ref={ref}
      style={{
        width: 400,
        height: 400,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 22,
        padding: '26px 26px 22px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: `${accent}25`,
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="18" height="15" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="scorecard-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <path
              d="M 35 145 L 35 25 A 28 28 0 0 1 35 81 L 75 81 Q 92 52 108 81 T 142 81 L 170 81"
              fill="none"
              stroke="url(#scorecard-logo-grad)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)' }}>
            Pulse Quizz
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {username && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.32)' }}>
              {username}
            </span>
          )}
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            padding: '3px 9px',
            borderRadius: 999,
            background: modePillBg,
            border: `1px solid ${modePillBorder}`,
            color: modePillColor,
          }}>
            {modeLabel}
          </span>
        </div>
      </div>

      {/* Tier label */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.11em',
        color: accent,
        opacity: 0.72,
        marginBottom: 4,
      }}>
        {tier.label}
      </div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 14 }}>
        <span style={{
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: accent,
        }}>
          {score}
        </span>
        <span style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.2)',
          marginBottom: 12,
        }}>
          {isCompetitif ? ' pts' : '/10'}
        </span>
      </div>

      {/* Dots — normal mode */}
      {!isCompetitif && (
        <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              height: 5,
              flex: 1,
              borderRadius: 999,
              background: i < score ? accent : 'rgba(255,255,255,0.08)',
            }} />
          ))}
        </div>
      )}

      {/* Rank — comp mode */}
      {isCompetitif && userRank != null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 13px',
          background: 'rgba(249,115,22,0.07)',
          border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: 10,
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#FB923C' }}>#{userRank}</span>
          <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'rgba(251,146,60,0.5)' }}>
            Classement mondial
          </div>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: 3,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '8px 4px',
          }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 10,
        fontSize: 10,
        color: 'rgba(255,255,255,0.28)',
        fontWeight: 600,
      }}>
        {ctaText} → pulse-quizz.vercel.app
      </div>
    </div>
  )
})

export default ScoreCard
