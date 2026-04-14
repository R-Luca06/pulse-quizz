import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useAuth } from '../../hooks/useAuth'
import GeneralTab from './tabs/GeneralTab'
import StatsTab from './tabs/StatsTab'
import ConfidentialityTab from './tabs/ConfidentialityTab'
import AchievementsPage from '../achievements/AchievementsPage'

const UserProfilePanel = lazy(() => import('../../pages/PublicProfilePage'))

type ProfileTab = 'general' | 'social' | 'public_profile' | 'achievements' | 'stats' | 'confidentiality'

interface Props {
  onBack: () => void
  defaultTab?: ProfileTab
}

const TAB_LABELS: Record<ProfileTab, string> = {
  general:        'Général',
  social:         'Social',
  public_profile: 'Mon profil',
  stats:          'Statistiques',
  achievements:   'Achievements',
  confidentiality:'Confidentialité',
}


// ─── Structure de navigation avec séparateurs ────────────────────────────────

type NavItem = {
  type: 'item'
  key: ProfileTab
  label: string
  mobileLabel: string
  disabled?: boolean
  icon: React.ReactNode
}
type NavSeparator = { type: 'separator' }
type NavEntry = NavItem | NavSeparator

const NAV_ENTRIES: NavEntry[] = [
  {
    type: 'item', key: 'general', label: 'Général', mobileLabel: 'Général',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    type: 'item', key: 'social', label: 'Social', mobileLabel: 'Social', disabled: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  { type: 'separator' },
  {
    type: 'item', key: 'public_profile', label: 'Mon profil', mobileLabel: 'Profil',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    type: 'item', key: 'achievements', label: 'Achievements', mobileLabel: 'Badges',
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
    type: 'item', key: 'stats', label: 'Statistiques', mobileLabel: 'Stats',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  { type: 'separator' },
  {
    type: 'item', key: 'confidentiality', label: 'Confidentialité', mobileLabel: 'Compte',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
]

// items seuls (sans séparateurs), pour la barre mobile
const NAV_ITEMS = NAV_ENTRIES.filter((e): e is NavItem => e.type === 'item')

// ─── Placeholder Social ───────────────────────────────────────────────────────

function SocialTab() {
  const features = [
    { icon: '👥', title: 'Amis', desc: 'Ajoute des joueurs et suis leurs stats' },
    { icon: '⚔️', title: 'Défis', desc: 'Lance des défis directs à tes amis' },
    { icon: '🏆', title: 'Classements amis', desc: 'Compare tes scores avec ton cercle' },
    { icon: '🎯', title: 'Parties privées', desc: 'Joue en groupe avec tes contacts' },
  ]
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {/* Icône centrale */}
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-game-border bg-game-card/60">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <span className="absolute -right-2 -top-2 rounded-full bg-neon-violet/15 px-2 py-0.5 text-[10px] font-bold text-neon-violet/70">
          Bientôt
        </span>
      </div>

      <h2 className="text-lg font-black text-white/70">Fonctionnalités sociales</h2>
      <p className="mt-1.5 max-w-xs text-sm text-white/30">
        Le mode multijoueur et les fonctionnalités sociales sont en cours de développement.
      </p>

      {/* Grille des features à venir */}
      <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
        {features.map(f => (
          <div
            key={f.title}
            className="flex flex-col gap-1.5 rounded-xl border border-game-border/50 bg-game-card/30 px-4 py-3 text-left"
          >
            <span className="text-xl opacity-40">{f.icon}</span>
            <p className="text-xs font-bold text-white/40">{f.title}</p>
            <p className="text-[11px] leading-relaxed text-white/20">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

const SESSION_KEY = 'profile_active_tab'

export default function ProfilePage({ onBack, defaultTab = 'general' }: Props) {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTabRaw] = useState<ProfileTab>(() => {
    const saved = sessionStorage.getItem(SESSION_KEY) as ProfileTab | null
    return saved ?? defaultTab
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function setActiveTab(tab: ProfileTab) {
    setActiveTabRaw(tab)
    sessionStorage.setItem(SESSION_KEY, tab)
  }

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
            disabled={item.disabled}
            onClick={() => !item.disabled && setActiveTab(item.key)}
            className={[
              'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
              item.disabled
                ? 'cursor-not-allowed opacity-25'
                : activeTab === item.key
                  ? 'text-neon-violet'
                  : 'text-white/30 hover:text-white/60',
            ].join(' ')}
          >
            {item.icon}
            <span className="text-[9px] font-semibold">{item.mobileLabel}</span>
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
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {NAV_ENTRIES.map((entry, i) => {
              if (entry.type === 'separator') {
                return (
                  <div key={`sep-${i}`} className={['my-1.5 transition-all duration-200', sidebarOpen ? 'mx-2' : 'mx-1'].join(' ')}>
                    <div className="h-px bg-game-border/70" />
                  </div>
                )
              }
              return (
                <button
                  key={entry.key}
                  disabled={entry.disabled}
                  onClick={() => !entry.disabled && setActiveTab(entry.key)}
                  title={entry.disabled && !sidebarOpen ? `${entry.label} — bientôt` : undefined}
                  className={[
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap',
                    entry.disabled
                      ? 'cursor-not-allowed opacity-30'
                      : activeTab === entry.key
                        ? 'bg-neon-violet/10 text-neon-violet'
                        : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                  ].join(' ')}
                >
                  <span className="shrink-0">{entry.icon}</span>
                  <span className={['truncate transition-opacity duration-200', sidebarOpen ? 'opacity-100' : 'opacity-0'].join(' ')}>
                    {entry.label}
                  </span>
                  {entry.disabled && sidebarOpen && (
                    <span className="ml-auto shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-white/25">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
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
          {activeTab === 'general'        && <GeneralTab />}
          {activeTab === 'social'         && <SocialTab />}
          {activeTab === 'stats'          && <StatsTab onBack={() => setActiveTab('general')} />}
          {activeTab === 'achievements'   && <AchievementsPage hideBack />}
          {activeTab === 'confidentiality'&& <ConfidentialityTab onBack={onBack} />}
          {activeTab === 'public_profile' && (
            <Suspense fallback={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-violet/30 border-t-neon-violet" /></div>}>
              <UserProfilePanel
                username={profile?.username ?? ''}
                onClose={() => setActiveTab('general')}
                hideNav
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
