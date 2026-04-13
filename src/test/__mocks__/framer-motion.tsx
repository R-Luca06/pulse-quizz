/**
 * Stub framer-motion pour tests Vitest (jsdom).
 *
 * Sans ce mock : ConstellationBackground crée 130+ motion.circle avec
 * repeat:Infinity → requestAnimationFrame infini dans jsdom → tests
 * extrêmement lents ou timeout.
 *
 * IMPORTANT : ce fichier NE doit PAS importer `vi` (non initialisé à ce stade).
 */
import React from 'react'

type AnyProps = Record<string, unknown> & { children?: React.ReactNode }

const MOTION_PROPS = new Set([
  'animate', 'initial', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
  'layout', 'layoutId', 'layoutDependency',
  'onAnimationComplete', 'onAnimationStart',
  'onViewportEnter', 'onViewportLeave',
  'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
  'dragTransition', 'onDragStart', 'onDragEnd', 'onDrag',
])

function makePassthrough(tag: string) {
  const Component = React.forwardRef<unknown, AnyProps>(({ children, ...props }, ref) => {
    const htmlProps: AnyProps = {}
    for (const [k, v] of Object.entries(props)) {
      if (!MOTION_PROPS.has(k)) htmlProps[k] = v
    }
    return React.createElement(tag, { ...htmlProps, ref }, children)
  })
  Component.displayName = `motion.${tag}`
  return Component
}

const cache: Record<string, ReturnType<typeof makePassthrough>> = {}

export const motion = new Proxy({} as Record<string, ReturnType<typeof makePassthrough>>, {
  get(_, tag: string) {
    if (!cache[tag]) cache[tag] = makePassthrough(tag)
    return cache[tag]
  },
})

export function AnimatePresence({ children }: { children?: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

const noop = () => {}
const noopFn = () => noop

export const useAnimation = noopFn
export const useAnimationControls = () => ({ start: noop, stop: noop, set: noop })
export const useReducedMotion = () => true
export const useMotionValue = (initial: number) => ({
  get: () => initial,
  set: noop,
  onChange: noop,
  subscribe: noop,
})
export const useTransform = () => ({ get: () => 0 })
export const useScroll = () => ({
  scrollY: { get: () => 0, onChange: noop },
  scrollYProgress: { get: () => 0, onChange: noop },
})
export const useSpring = (val: unknown) => val
export const useDragControls = () => ({ start: noop })
