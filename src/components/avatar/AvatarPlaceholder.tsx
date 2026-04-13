interface Props {
  className?: string
}

export default function AvatarPlaceholder({ className }: Props) {
  return (
    <div
      data-testid="avatar-placeholder"
      className={
        className ??
        'relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neon-violet/20 to-neon-blue/20 animate-pulse-ring'
      }
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-24 w-24 text-white/40"
        aria-hidden="true"
      >
        <circle cx="32" cy="22" r="10" />
        <path d="M12 54c0-10 9-16 20-16s20 6 20 16" />
      </svg>
    </div>
  )
}
