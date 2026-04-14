import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import GeneralTab from './tabs/GeneralTab'
import StatsTab from './tabs/StatsTab'
import ConfidentialityTab from './tabs/ConfidentialityTab'
import AchievementsPage from '../achievements/AchievementsPage'

type ProfileTab = 'general' | 'stats' | 'achievements' | 'confidentiality'

interface Props {
  onBack: () => void
  defaultTab?: ProfileTab
  onShowAchievements?: () => void
}

const TAB_LABELS: Record<ProfileTab, string> = {
  general: 'Général',
  stats: 'Statistiques',
  achievements: 'Achievements',
  confidentiality: 'Confidentialité',
}

const MOBILE_LABELS: Record<ProfileTab, string> = {
  general: 'Général',
  stats: 'Stats',
  achievements: 'Badges',
  confidentiality: 'Compte',
}

const NAV_ITEMS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'general',
    label: 'Général',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    key: 'stats',
    label: 'Statistiques',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    key: 'achievements',
    label: 'Achievements',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
    ),
  },
  {
    key: 'confidentiality',
    label: 'Confidentialité',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
]

export default function ProfilePage({ onBack, defaultTab = 'general' }: Props) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>(defaultTab)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleBack = useCallback(() => onBack(), [onBack])

  useEffect(() => {
    if (!user) handleBack()
  }, [user, handleBack])

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col bg-game-bg">
      {/* Top bar */}
      <div className="flex items-center border-b border-game-border px-4 py-2.5">
        <button
          onClick={handleBack}
          className="flex w-20 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </button>
        <div className="flex flex-1 justify-center">
          <p className="text-sm text-white/40">
            Paramètres <span className="mx-1 text-white/15">·</span>
            <span className="text-white/65">{TAB_LABELS[activeTab]}</span>
          </p>
        </div>
        <div className="w-20" />
      </div>

      {/* Tab bar mobile (< sm) */}
      <div className="flex items-center border-b border-game-border bg-game-bg sm:hidden">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key)}
            className={[
              'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
              activeTab === item.key ? 'text-neon-violet' : 'text-white/30 hover:text-white/60',
            ].join(' ')}
          >
            {item.icon}
            <span className="text-[9px] font-semibold">{MOBILE_LABELS[item.key]}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — desktop uniquement (sm+) */}
        <div
          className={[
            'hidden sm:flex shrink-0 flex-col border-r border-game-border bg-game-bg transition-[width] duration-200 ease-in-out overflow-hidden',
            sidebarOpen ? 'w-44' : 'w-14',
          ].join(' ')}
        >
          {/* Nav items */}
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === item.key
                    ? 'bg-neon-violet/10 text-neon-violet'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                ].join(' ')}
              >
                <span className="shrink-0">{item.icon}</span>
                <span
                  className={[
                    'truncate transition-opacity duration-200',
                    sidebarOpen ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          {/* Toggle button */}
          <div className="border-t border-game-border p-2">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="flex w-full items-center justify-center rounded-xl p-2 text-white/20 transition-colors hover:bg-white/5 hover:text-white/50"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'stats' && <StatsTab onBack={() => setActiveTab('general')} />}
          {activeTab === 'achievements' && <AchievementsPage hideBack />}
          {activeTab === 'confidentiality' && <ConfidentialityTab onBack={onBack} />}
        </div>
      </div>
    </div>
  )
}
