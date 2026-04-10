// ─── Audio constants ─────────────────────────────────────────────────────────
const FREQ = { correct1: 523, correct2: 783, wrong: 220, timeout: 180, tick: 900 } as const
const VOL  = { correct1: 0.15, correct2: 0.12, wrong: 0.12, timeout: 0.1, tick: 0.06 } as const
const DUR  = { correct1: 0.1, correct2: 0.18, wrong: 0.18, timeout: 0.22, tick: 0.04 } as const
const CORRECT_CHORD_DELAY_MS = 80

let ctx: AudioContext | null = null
let muted = false

export function setMuted(v: boolean) { muted = v }
export function getMuted(): boolean { return muted }

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null
      ctx = new AudioCtx()
    }
    return ctx
  } catch {
    return null
  }
}

export function unlockAudio() {
  const context = getCtx()
  if (context && context.state === 'suspended') {
    context.resume().catch(() => {})
  }
}

function playNode(context: AudioContext, freq: number, duration: number, type: OscillatorType, volume: number) {
  try {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.connect(gain)
    gain.connect(context.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
    osc.start()
    osc.stop(context.currentTime + duration)
  } catch {
    // ignore
  }
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.18,
) {
  if (muted) return
  const context = getCtx()
  if (!context) return
  if (context.state === 'suspended') {
    context.resume().then(() => playNode(context, freq, duration, type, volume)).catch(() => {})
  } else {
    playNode(context, freq, duration, type, volume)
  }
}

export function playCorrect() {
  beep(FREQ.correct1, DUR.correct1, 'sine', VOL.correct1)
  setTimeout(() => beep(FREQ.correct2, DUR.correct2, 'sine', VOL.correct2), CORRECT_CHORD_DELAY_MS)
}

export function playWrong() {
  beep(FREQ.wrong, DUR.wrong, 'sawtooth', VOL.wrong)
}

export function playTimeout() {
  beep(FREQ.timeout, DUR.timeout, 'triangle', VOL.timeout)
}

export function playTick() {
  beep(FREQ.tick, DUR.tick, 'square', VOL.tick)
}
