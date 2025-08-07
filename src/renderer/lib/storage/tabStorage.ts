const TAB_STORAGE_KEY = 'openTabIds';

export const TabStorage = {
  save(tabIds: string[]): void {
    localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(tabIds));
  },

  load(): string[] {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  clear(): void {
    localStorage.removeItem(TAB_STORAGE_KEY);
  }
};