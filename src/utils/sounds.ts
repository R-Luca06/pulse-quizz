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
  beep(523, 0.1, 'sine', 0.15)
  setTimeout(() => beep(783, 0.18, 'sine', 0.12), 80)
}

export function playWrong() {
  beep(220, 0.18, 'sawtooth', 0.12)
}

export function playTimeout() {
  beep(180, 0.22, 'triangle', 0.1)
}

export function playTick() {
  beep(900, 0.04, 'square', 0.06)
}
