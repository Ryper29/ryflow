export function createLyricsCache(maxEntries = 50) {
  const store = new Map();

  return {
    get(key) {
      if (!store.has(key)) return undefined;
      const value = store.get(key);
      store.delete(key);
      store.set(key, value);
      return value;
    },
    set(key, value) {
      if (maxEntries <= 0 || !value || value.status === 'not_found') return;
      if (store.has(key)) store.delete(key);
      while (store.size >= maxEntries) {
        const oldestKey = store.keys().next().value;
        store.delete(oldestKey);
      }
      store.set(key, value);
    },
  };
}
