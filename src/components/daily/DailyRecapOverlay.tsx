import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DailyRecapData, QuestionResult, AchievementWithStatus, AchievementTier } from '../../types/quiz'
import { getLevelFromXp, getLevelProgress, getXpForLevel } from '../../constants/levels'
import { XP_PER_ACHIEVEMENT } from '../../constants/xp'
import { PULSES_PER_ACHIEVEMENT } from '../../constants/pulses'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data: DailyRecapData
  onClose: () => void
  onPlayDailyToday?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

type Phase = 1 | 2 | 3 | 4 | 5 | 6

const EASE = [0.22, 1, 0.36, 1] as const

const TIER_RANK: Record<AchievementTier, number> = { legendary: 3, epic: 2, rare: 1, common: 0 }

const TIER_STROKE: Record<AchievementTier, string> = {
  common:    'rgba(255,255,255,0.35)',
  rare:      '#3B82F6',
  epic:      '#8B5CF6',
  legendary: '#EAB308',
}

const TIER_GLOW: Record<AchievementTier, string> = {
  common:    'rgba(255,255,255,0.3)',
  rare:      'rgba(59,130,246,0.55)',
  epic:      'rgba(139,92,246,0.6)',
  legendary: 'rgba(234,179,8,0.6)',
}

const TIER_LABEL: Record<AchievementTier, string> = {
  common:    'Commun',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Légendaire',
}

const TIER_TEXT: Record<AchievementTier, string> = {
  common:    'text-white/70',
  rare:      'text-neon-blue',
  epic:      'text-neon-violet',
  legendary: 'text-neon-gold',
}

const TIER_BG: Record<AchievementTier, string> = {
  common:    'bg-white/10 border-white/15',
  rare:      'bg-neon-blue/[0.08] border-neon-blue/25',
  epic:      'bg-neon-violet/[0.08] border-neon-violet/25',
  legendary: 'bg-neon-gold/[0.1] border-neon-gold/30',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

function computeTopPercent(rank: number | null, total: number): number | null {
  if (rank === null || total <= 0) return null
  return Math.max(1, Math.round((rank / total) * 100))
}

function sumAchievementXp(list: AchievementWithStatus[]): number {
  return list.reduce((sum, a) => sum + XP_PER_ACHIEVEMENT[a.tier], 0)
}

function sumAchievementPulses(list: AchievementWithStatus[]): number {
  return list.reduce((sum, a) => sum + PULSES_PER_ACHIEVEMENT[a.tier], 0)
}

// ─── Entry component ─────────────────────────────────────────────────────────

export default function DailyRecapOverlay({ data, onClose, onPlayDailyToday }: Props) {
  const [phase, setPhase] = useState<Phase>(1)
  const [qIdx, setQIdx] = useState(0)

  const results = data.questions
  const correctCount = useMemo(() => results.filter(r => r.isCorrect).length, [results])
  const timeoutCount = useMemo(() => results.filter(r => r.userAnswer === null && !r.isCorrect).length, [results])
  const wrongCount   = Math.max(0, results.length - correctCount - timeoutCount)
  const maxStreak    = useMemo(() => {
    let cur = 0, max = 0
    for (const r of results) { if (r.isCorrect) { cur++; max = Math.max(max, cur) } else cur = 0 }
    return max
  }, [results])

  const achievementXp     = sumAchievementXp(data.unlockedAchievements)
  const achievementPulses = sumAchievementPulses(data.unlockedAchievements)
  const totalXpGained     = data.entry.xp_earned + achievementXp
  const totalPulsesGained = data.pulsesEarned + achievementPulses

  // Level-up : approximation, cf notes dans le plan
  const levelBefore = getLevelFromXp(Math.max(0, data.totalXpNow - totalXpGained))
  const levelAfter  = getLevelFromXp(data.totalXpNow)
  const progressNow = getLevelProgress(data.totalXpNow)

  const sortedAchievements = useMemo(
    () => [...data.unlockedAchievements].sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]),
    [data.unlockedAchievements],
  )
  const heroAchievement = sortedAchievements[0] ?? null
  const otherAchievements = sortedAchievements.slice(1)

  const hasPhase5 = sortedAchievements.length > 0
  const visiblePhases = useMemo<Phase[]>(
    () => (hasPhase5 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 6]),
    [hasPhase5],
  )

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        const idx = visiblePhases.indexOf(phase)
        if (idx < 0) return
        if (idx >= visiblePhases.length - 1) { onClose(); return }
        setPhase(visiblePhases[idx + 1])
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const idx = visiblePhases.indexOf(phase)
        if (idx > 0) setPhase(visiblePhases[idx - 1])
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, visiblePhases, onClose])

  function goNext() {
    const idx = visiblePhases.indexOf(phase)
    if (idx < 0 || idx >= visiblePhases.length - 1) { onClose(); return }
    setPhase(visiblePhases[idx + 1])
  }

  function handlePlayToday() {
    if (onPlayDailyToday) onPlayDailyToday()
    else onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      key="daily-recap-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[60] overflow-hidden bg-game-bg font-game"
    >
      {/* Aurora backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[30%] blur-[40px]"
        style={{
          background:
            'radial-gradient(ellipse 40% 40% at 30% 30%, rgba(139,92,246,0.20), transparent 60%), ' +
            'radial-gradient(ellipse 40% 40% at 70% 70%, rgba(59,130,246,0.15), transparent 60%), ' +
            'radial-gradient(ellipse 30% 30% at 80% 20%, rgba(236,72,153,0.10), transparent 60%)',
        }}
      />

      {/* Top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3">
        <div className="w-16" />
        <div className="flex items-center gap-1.5">
          {visiblePhases.map(p => {
            const active = p === phase
            const done   = visiblePhases.indexOf(p) < visiblePhases.indexOf(phase)
            return (
              <span
                key={p}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  active ? 'w-8 bg-neon-violet' : done ? 'w-5 bg-neon-violet/55' : 'w-5 bg-white/10'
                }`}
              />
            )
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          Passer
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Scenes */}
      <div className="relative flex h-full w-full items-center justify-center overflow-y-auto px-4 py-16">
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <PhaseTheme key="p1" data={data} onNext={goNext} />
          )}
          {phase === 2 && (
            <PhaseScore
              key="p2"
              score={data.entry.score}
              results={results}
              correctCount={correctCount}
              wrongCount={wrongCount}
              timeoutCount={timeoutCount}
              maxStreak={maxStreak}
              onNext={goNext}
            />
          )}
          {phase === 3 && (
            <PhaseRanking
              key="p3"
              rank={data.rank}
              total={data.totalPlayers}
              topThree={data.topThree}
              myScore={data.entry.score}
              onNext={goNext}
            />
          )}
          {phase === 4 && (
            <PhaseQuestions
              key="p4"
              questions={results}
              qIdx={qIdx}
              setQIdx={setQIdx}
              onNext={goNext}
            />
          )}
          {phase === 5 && hasPhase5 && heroAchievement && (
            <PhaseAchievements
              key="p5"
              hero={heroAchievement}
              others={otherAchievements}
              onNext={goNext}
            />
          )}
          {phase === 6 && (
            <PhaseTotal
              key="p6"
              data={data}
              totalXpGained={totalXpGained}
              totalPulsesGained={totalPulsesGained}
              correctCount={correctCount}
              maxStreak={maxStreak}
              achievementXp={achievementXp}
              achievementPulses={achievementPulses}
              levelBefore={levelBefore}
              levelAfter={levelAfter}
              progressNow={progressNow}
              onPlayToday={handlePlayToday}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Phase 1 : Theme ──────────────────────────────────────────────────────────

function PhaseTheme({ data, onNext }: { data: DailyRecapData; onNext: () => void }) {
  const dateLabel = formatDate(data.entry.date)
  const emoji     = data.theme?.emoji ?? '📅'
  const title     = data.theme?.title ?? 'Défi journalier'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full max-w-md flex-col items-center gap-4 text-center"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25"
      >
        Pendant votre absence…
      </motion.span>

      <div className="relative">
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scaleX: 8, scaleY: 0.3 }}
          animate={{ opacity: [0, 0.9, 0], scaleX: [8, 1.5, 0.2], scaleY: [0.3, 1.1, 0.8] }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          className="absolute -left-[60px] -top-[60px] -z-10 h-[220px] w-[220px]"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(139,92,246,0.18) 45%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />
        <motion.span
          initial={{ y: -60, scale: 0.6, opacity: 0, filter: 'blur(14px)' }}
          animate={{ y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: EASE }}
          className="block text-[96px]"
          style={{ filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.65))' }}
        >
          {emoji}
        </motion.span>
      </div>

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
        className="flex flex-col items-center gap-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
            Défi du {dateLabel} · terminé
          </span>
        </div>
        <h1
          className="text-5xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, rgba(167,139,250,0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.7, ease: EASE }}
          className="h-px w-32 origin-left bg-gradient-to-r from-transparent via-neon-violet/60 to-transparent"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.9, ease: EASE }}
          className="max-w-sm text-sm text-white/40"
        >
          {data.theme?.description ?? "Voici ce qui s'est passé sur le défi quotidien pendant que tu étais absent."}
        </motion.p>
      </motion.div>

      <ContinueButton label="Continuer" onClick={onNext} delay={1.2} />
    </motion.div>
  )
}

// ─── Phase 2 : Score ──────────────────────────────────────────────────────────

function PhaseScore({
  score, results, correctCount, wrongCount, timeoutCount, maxStreak, onNext,
}: {
  score: number
  results: QuestionResult[]
  correctCount: number
  wrongCount: number
  timeoutCount: number
  maxStreak: number
  onNext: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full max-w-md flex-col items-center gap-6 text-center"
    >
      <motion.span
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25"
      >
        Ton score
      </motion.span>

      <div className="relative flex flex-col items-center gap-2">
        <div
          aria-hidden
          className="absolute -left-[110px] -top-[110px] -z-10 h-[420px] w-[420px]"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.2) 0%, transparent 60%)', filter: 'blur(40px)' }}
        />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.06, 1], opacity: [0, 1, 1] }}
          transition={{ duration: 0.55, times: [0, 0.6, 1], ease: EASE }}
          className="flex items-end gap-3"
        >
          <span className="text-8xl font-black leading-none text-neon-violet" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatNumber(score)}
          </span>
          <span className="mb-3 text-2xl font-black text-white/20">pts</span>
        </motion.div>
        {correctCount === results.length && results.length > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
            className="rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-yellow-400"
          >
            Score parfait
          </motion.span>
        )}
      </div>

      {/* Breakdown dots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.5 }}
        className="flex flex-wrap justify-center gap-1.5"
      >
        {results.map((r, i) => (
          <span
            key={i}
            className="h-2 w-6 rounded-full"
            style={{
              background: r.userAnswer === null && !r.isCorrect
                ? 'rgba(255,255,255,0.18)'
                : r.isCorrect
                  ? '#22C55E'
                  : '#EF4444',
            }}
          />
        ))}
      </motion.div>

      {/* Counters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.6 }}
        className="grid w-full grid-cols-4 gap-2"
      >
        <Counter value={correctCount}             label="Correct" color="text-game-success" />
        <Counter value={wrongCount}               label="Faux"    color="text-game-danger" />
        <Counter value={timeoutCount}             label="Timeout" color="text-white/40" />
        <Counter value={`${maxStreak}×`}          label="Série"   color="text-yellow-400" />
      </motion.div>

      <ContinueButton label="Continuer" onClick={onNext} delay={0.9} />
    </motion.div>
  )
}

function Counter({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] py-3">
      <span className={`text-lg font-black ${color}`}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{label}</span>
    </div>
  )
}

// ─── Phase 3 : Ranking ────────────────────────────────────────────────────────

function PhaseRanking({
  rank, total, topThree, myScore, onNext,
}: {
  rank: number | null
  total: number
  topThree: DailyRecapData['topThree']
  myScore: number
  onNext: () => void
}) {
  const topPercent = computeTopPercent(rank, total)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
      className="flex w-full max-w-md flex-col items-center gap-6 text-center"
    >
      <motion.span
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25"
      >
        Classement définitif
      </motion.span>

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.06, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.55, times: [0, 0.6, 1], ease: EASE }}
        className="relative flex flex-col items-center gap-3"
      >
        {/* ring pulses */}
        <motion.div
          aria-hidden
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.6], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          className="absolute h-20 w-20 rounded-full border-2 border-neon-violet/55"
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-neon-violet bg-neon-violet/10 shadow-neon-violet">
          <span className="text-3xl font-black text-white">{rank !== null ? `#${rank}` : '—'}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
        className="flex flex-col items-center gap-1"
      >
        <p className="text-base font-semibold text-white/70">
          sur <strong className="text-white">{formatNumber(total)} joueur{total > 1 ? 's' : ''}</strong>
        </p>
        {topPercent !== null && (
          <p className="text-xs text-white/30">Top {topPercent}% aujourd'hui</p>
        )}
      </motion.div>

      {/* Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.5 }}
        className="w-full rounded-2xl border border-white/[0.06] bg-game-card p-3"
      >
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">Podium du jour</p>
        <div className="flex flex-col gap-1.5">
          {topThree.map(entry => (
            <PodiumRow
              key={entry.id}
              rank={entry.rank}
              username={entry.username}
              score={entry.score}
              isMe={rank !== null && entry.rank === rank}
            />
          ))}
          {rank !== null && rank > 3 && (
            <>
              <div className="my-1 flex items-center gap-2 px-1">
                <span className="h-px flex-1 bg-white/5" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-white/20">···</span>
                <span className="h-px flex-1 bg-white/5" />
              </div>
              <PodiumRow rank={rank} username="Toi" score={myScore} isMe highlight />
            </>
          )}
        </div>
      </motion.div>

      <ContinueButton label="Revoir les questions" onClick={onNext} delay={0.8} />
    </motion.div>
  )
}

function PodiumRow({
  rank, username, score, isMe, highlight,
}: {
  rank: number
  username: string
  score: number
  isMe: boolean
  highlight?: boolean
}) {
  const rankColor = rank === 1 ? 'text-neon-gold' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-orange-400' : 'text-neon-violet'
  const wrapCls = highlight || (isMe && rank > 3)
    ? 'flex items-center gap-3 rounded-lg border border-neon-violet/30 bg-neon-violet/[0.08] px-3 py-2'
    : isMe
      ? 'flex items-center gap-3 rounded-lg border border-neon-violet/30 bg-neon-violet/[0.08] px-3 py-2'
      : 'flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2'
  const nameCls = isMe ? 'flex-1 truncate text-sm font-bold text-neon-violet' : 'flex-1 truncate text-sm font-bold text-white'
  const scoreCls = isMe ? 'text-xs font-black text-neon-violet' : 'text-xs font-black text-white/80'

  return (
    <div className={wrapCls}>
      <span className={`w-5 text-center text-[11px] font-black ${isMe ? 'text-neon-violet' : rankColor}`} style={{ fontVariantNumeric: 'tabular-nums' }}>#{rank}</span>
      <span className={nameCls}>
        {username}
        {isMe && <span className="ml-1 text-[10px] text-neon-violet/50">(moi)</span>}
      </span>
      <span className={scoreCls} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(score)}</span>
    </div>
  )
}

// ─── Phase 4 : Questions carrousel ────────────────────────────────────────────

function PhaseQuestions({
  questions, qIdx, setQIdx, onNext,
}: {
  questions: QuestionResult[]
  qIdx: number
  setQIdx: (i: number) => void
  onNext: () => void
}) {
  if (questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
        className="flex w-full max-w-lg flex-col items-center gap-4 text-center"
      >
        <p className="text-sm text-white/40">Les questions de ce défi ne sont pas disponibles.</p>
        <ContinueButton label="Voir mes récompenses" onClick={onNext} />
      </motion.div>
    )
  }

  const safeIdx = Math.max(0, Math.min(questions.length - 1, qIdx))
  const r = questions[safeIdx]
  const isTimeout = r.userAnswer === null && !r.isCorrect
  const statusLabel = isTimeout ? 'Timeout' : r.isCorrect ? 'Correct' : 'Faux'
  const leftBorder  = r.isCorrect ? '#22C55E' : '#EF4444'
  const mult = r.multiplier ?? 0

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
      className="flex w-full max-w-lg flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25">Le saviez-vous ?</span>
        <span className="text-[10px] text-white/30">Question {safeIdx + 1} / {questions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={safeIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-game-card p-5"
          style={{ borderLeft: `3px solid ${leftBorder}` }}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-black ${r.isCorrect ? 'text-game-success' : 'text-game-danger'}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {String(safeIdx + 1).padStart(2, '0')} / {questions.length}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${r.isCorrect ? 'text-game-success/70' : 'text-game-danger/70'}`}>
                {statusLabel}
              </span>
              {r.isCorrect && mult > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${mult >= 3 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-purple-500/15 text-purple-400'}`}>
                  ×{mult}
                </span>
              )}
              {r.isCorrect && (r.pointsEarned ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-orange-400">+{r.pointsEarned}</span>
              )}
              <span className="text-[10px] text-white/25" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.timeSpent.toFixed(1)}s
              </span>
            </div>
          </div>
          <h3 className="text-lg font-bold leading-snug text-white">{r.question}</h3>
          <div className="flex flex-col gap-1">
            {r.userAnswer !== null ? (
              <p className="text-xs">
                <span className="text-white/30">Ta réponse · </span>
                <span className={`font-semibold ${r.isCorrect ? 'text-game-success' : 'text-game-danger'}`}>{r.userAnswer}</span>
              </p>
            ) : (
              <p className="text-xs italic text-white/30">Pas de réponse dans le temps</p>
            )}
            {!r.isCorrect && (
              <p className="text-xs">
                <span className="text-white/30">Réponse correcte · </span>
                <span className="font-semibold text-game-success">{r.correctAnswer}</span>
              </p>
            )}
          </div>
          {r.anecdote && (
            <div className="mt-1 flex gap-3 rounded-xl border border-neon-cyan/15 bg-neon-cyan/[0.04] px-4 py-3">
              <span className="shrink-0 text-lg">💡</span>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neon-cyan/70">Le saviez-vous ?</p>
                <p className="text-[13px] leading-relaxed text-white/70">{r.anecdote}</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setQIdx(Math.max(0, safeIdx - 1))}
          disabled={safeIdx === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors enabled:hover:text-white disabled:opacity-30"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQIdx(i)}
              className={`h-1 w-4 rounded-full transition-colors ${
                i === safeIdx ? 'bg-neon-violet' : i < safeIdx ? 'bg-neon-violet/40' : 'bg-white/10'
              }`}
              aria-label={`Question ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setQIdx(Math.min(questions.length - 1, safeIdx + 1))}
          disabled={safeIdx === questions.length - 1}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors enabled:hover:text-white disabled:opacity-30"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <ContinueButton label="Voir mes récompenses" onClick={onNext} className="mx-auto" />
    </motion.div>
  )
}

// ─── Phase 5 : Achievements ───────────────────────────────────────────────────

function PhaseAchievements({
  hero, others, onNext,
}: {
  hero: AchievementWithStatus
  others: AchievementWithStatus[]
  onNext: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
      className="flex w-full max-w-md flex-col items-center gap-6 text-center"
    >
      <motion.span
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25"
      >
        Achievements débloqués
      </motion.span>

      {/* Hero */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.06, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.55, times: [0, 0.6, 1], ease: EASE }}
        className="relative flex flex-col items-center gap-4"
      >
        <div
          aria-hidden
          className="absolute -left-[70px] -top-[52px] -z-10 h-[220px] w-[220px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${TIER_GLOW[hero.tier]} 0%, rgba(139,92,246,0.2) 45%, transparent 70%)`,
            filter: 'blur(28px)',
          }}
        />
        <div
          className="flex items-center justify-center"
          style={{
            width: 96,
            height: 108,
            background: '#1E1E2E',
            border: `2px solid ${TIER_STROKE[hero.tier]}`,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            filter: `drop-shadow(0 0 16px ${TIER_GLOW[hero.tier]})`,
          }}
        >
          <span className="text-5xl">{hero.icon}</span>
        </div>

        <div className={`rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${TIER_TEXT[hero.tier]}`} style={{ background: `${TIER_GLOW[hero.tier].replace('0.6)', '0.15)').replace('0.55)', '0.15)').replace('0.3)', '0.1)')}` }}>
          ✦ {TIER_LABEL[hero.tier]} · +{XP_PER_ACHIEVEMENT[hero.tier]} XP · +{PULSES_PER_ACHIEVEMENT[hero.tier]} ◈
        </div>
        <div>
          <p className="text-2xl font-black text-white">{hero.name}</p>
          <p className="mt-1 max-w-xs text-sm text-white/45">{hero.description}</p>
        </div>
      </motion.div>

      {/* Others */}
      {others.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4 + i * 0.1 }}
          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${TIER_BG[a.tier]}`}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 44,
              height: 50,
              background: '#1E1E2E',
              border: `2px solid ${TIER_STROKE[a.tier]}`,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              filter: `drop-shadow(0 0 6px ${TIER_GLOW[a.tier]})`,
            }}
          >
            <span className="text-lg">{a.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">{a.name}</p>
            <p className="truncate text-[11px] text-white/45">{a.description}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${TIER_TEXT[a.tier]}`} style={{ background: 'rgba(255,255,255,0.05)' }}>
            {TIER_LABEL[a.tier]}
          </span>
        </motion.div>
      ))}

      <ContinueButton label="Voir le total" onClick={onNext} delay={0.6} />
    </motion.div>
  )
}

// ─── Phase 6 : Total + Level-up ───────────────────────────────────────────────

function PhaseTotal({
  data, totalXpGained, totalPulsesGained, correctCount, maxStreak,
  achievementXp, achievementPulses, levelBefore, levelAfter, progressNow,
  onPlayToday, onClose,
}: {
  data: DailyRecapData
  totalXpGained: number
  totalPulsesGained: number
  correctCount: number
  maxStreak: number
  achievementXp: number
  achievementPulses: number
  levelBefore: number
  levelAfter: number
  progressNow: ReturnType<typeof getLevelProgress>
  onPlayToday: () => void
  onClose: () => void
}) {
  const leveledUp = levelAfter > levelBefore
  const xpForCurrent = getXpForLevel(levelAfter)
  const xpForNext    = getXpForLevel(levelAfter + 1)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
      className="flex w-full max-w-md flex-col items-center gap-5 text-center"
    >
      <motion.span
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25"
      >
        Total gagné
      </motion.span>

      {/* XP + Pulses pills */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.06, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.55, times: [0, 0.6, 1], ease: EASE }}
        className="flex w-full gap-3"
      >
        <div className="flex-1 rounded-2xl border border-neon-violet/30 bg-neon-violet/[0.08] p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neon-violet/70">✦ XP</span>
          </div>
          <div className="mt-1 text-3xl font-black text-neon-violet" style={{ fontVariantNumeric: 'tabular-nums' }}>
            +{formatNumber(totalXpGained)}
          </div>
          <p className="mt-1 text-[10px] text-white/35">
            Défi {data.entry.xp_earned - Math.round(data.entry.xp_earned * (1 - 1 / data.entry.multiplier))} · Achievements {achievementXp}
            {data.entry.multiplier > 1 && ` · ×${data.entry.multiplier.toFixed(1)} série`}
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/70">◈ Pulses</span>
          </div>
          <div className="mt-1 text-3xl font-black text-cyan-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
            +{formatNumber(totalPulsesGained)}
          </div>
          <p className="mt-1 text-[10px] text-white/35">
            Défi {data.pulsesEarned} · Correct {correctCount} · Série {maxStreak}× · Achievements {achievementPulses}
          </p>
        </div>
      </motion.div>

      {/* Level up */}
      {leveledUp && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
          className="w-full rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] p-4"
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-yellow-400">
              Niveau {levelAfter} atteint !
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Niveau {levelBefore} → {levelAfter}</span>
              <span className="text-[10px] text-white/30" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatNumber(data.totalXpNow - xpForCurrent)} / {formatNumber(xpForNext - xpForCurrent)} XP
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressNow.percentage}%` }}
                transition={{ duration: 1, delay: 0.4, ease: EASE }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.55 }}
        className="flex w-full flex-col gap-2"
      >
        <button
          type="button"
          onClick={onPlayToday}
          className="relative w-full overflow-hidden rounded-2xl py-3.5 text-center font-black text-white"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
            boxShadow: '0 0 32px rgba(124,58,237,0.45), 0 0 64px rgba(37,99,235,0.2)',
          }}
        >
          <motion.span
            aria-hidden
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />
          <span className="relative">Jouer le défi d'aujourd'hui →</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/30 hover:text-white/60"
        >
          Revenir à l'accueil
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function ContinueButton({
  label, onClick, delay = 0.4, className = '',
}: { label: string; onClick: () => void; delay?: number; className?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </motion.button>
  )
}
