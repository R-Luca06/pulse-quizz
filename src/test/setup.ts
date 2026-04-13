import '@testing-library/jest-dom'

// Polyfill IntersectionObserver for framer-motion's whileInView in jsdom
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  // @ts-expect-error jsdom polyfill
  globalThis.IntersectionObserver = IntersectionObserverStub
}
