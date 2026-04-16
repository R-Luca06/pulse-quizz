import { toBlob } from 'dom-to-image-more'

export async function generateScoreBlob(el: HTMLElement): Promise<Blob> {
  return toBlob(el, { scale: 2 })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyBlobToClipboard(blob: Blob): Promise<void> {
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ])
}

export async function nativeShareBlob(blob: Blob, filename = 'pulse-score.png'): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' })
  await navigator.share({ files: [file], title: 'Mon score Pulse Quizz' })
}

export function canNativeShare(): boolean {
  try {
    return (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([], 'test.png', { type: 'image/png' })] })
    )
  } catch {
    return false
  }
}
