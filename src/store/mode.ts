import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ModeStore {
  mode: string
  setMode: (mode: string) => void
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set) => ({
      mode: "note",
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "mode-storage",
    },
  ),
)
