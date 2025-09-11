// lib/progressBus.ts
type Listener = () => void;
const listeners = new Set<Listener>();

export const startProgress = () => {
  for (const l of Array.from(listeners)) {
    try { l(); } catch { /* swallow listener errors */ }
  }
};

export const onProgressStart = (cb: Listener) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
