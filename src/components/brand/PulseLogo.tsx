import { useId } from 'react'

type Variant = 'gradient' | 'white' | 'mono-violet'

interface Props {
  size?: number
  variant?: Variant
  className?: string
  title?: string
}

const LOGO_PATH =
  'M 35 145 L 35 25 A 28 28 0 0 1 35 81 L 75 81 Q 92 52 108 81 T 142 81 L 170 81'

export default function PulseLogo({
  size = 32,
  variant = 'gradient',
  className,
  title = 'Pulse Quizz',
}: Props) {
  const gradientId = useId()
  const height = Math.round((size * 160) / 200)

  const stroke =
    variant === 'white'
      ? '#ffffff'
      : variant === 'mono-violet'
      ? '#8B5CF6'
      : `url(#${gradientId})`

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 160"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      )}
      <path
        d={LOGO_PATH}
        fill="none"
        stroke={stroke}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
