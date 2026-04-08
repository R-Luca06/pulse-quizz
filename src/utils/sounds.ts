function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.18,
) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext not available (SSR / test env)
  }
}

export function playCorrect() {
  // Rising two-tone: pleasant "ding"
  beep(523, 0.1, 'sine', 0.15)       // C5
  setTimeout(() => beep(783, 0.18, 'sine', 0.12), 80) // G5
}

export function playWrong() {
  // Descending: short buzz
  beep(220, 0.18, 'sawtooth', 0.12)
}

export function playTimeout() {
  beep(180, 0.22, 'triangle', 0.1)
}

export function playTick() {
  beep(900, 0.04, 'square', 0.06)
}
