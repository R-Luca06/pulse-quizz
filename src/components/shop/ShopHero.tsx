import { ShopBagIcon } from './icons'

interface Props {
  total: number
  nbNew: number
  pulsesBalance: number
}

function formatFr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\s/g, '\u00A0')
}

export default function ShopHero({ total, nbNew, pulsesBalance }: Props) {
  return (
    <div
      className="relative overflow-hidden border-b border-game-border px-6 py-5"
      style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.06), rgba(19,19,31,0.3), transparent)' }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: 'rgba(234,179,8,0.06)' }}
      />
      <div className="relative flex flex-wrap items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{
            background: 'rgba(234,179,8,0.10)',
            border:     '1px solid rgba(234,179,8,0.22)',
            color:      'rgba(234,179,8,0.75)',
          }}
        >
          <ShopBagIcon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-white">Boutique</p>
          <p className="mt-0.5 text-xs text-white/35">
            {total} objet{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}
            {nbNew > 0 && <> · {nbNew} nouveauté{nbNew !== 1 ? 's' : ''} cette semaine</>}
          </p>
        </div>

        <div
          className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-2.5"
          style={{
            background: 'rgba(34,211,238,0.05)',
            border:     '1px solid rgba(34,211,238,0.20)',
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-base font-black"
            style={{
              background: 'radial-gradient(circle at 40% 30%, rgba(34,211,238,0.35), rgba(34,211,238,0.10))',
              border:     '1px solid rgba(34,211,238,0.4)',
              color:      '#22d3ee',
              boxShadow:  '0 0 16px rgba(34,211,238,0.20)',
            }}
            aria-hidden
          >
            ◈
          </div>
          <div className="leading-tight">
            <span
              className="block text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: 'rgba(34,211,238,0.65)' }}
            >
              Solde Pulses
            </span>
            <div
              className="text-xl font-extrabold tabular-nums text-white"
              style={{ letterSpacing: '-0.01em' }}
            >
              {formatFr(pulsesBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
