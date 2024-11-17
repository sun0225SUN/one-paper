"use client"

import { ChartNoAxesGantt, TableOfContents } from "lucide-react"
import { useModeStore } from "~/store/mode"

export function ModeToggle() {
  const { mode, setMode } = useModeStore()

  return (
    <div
      className="cursor-pointer"
      onClick={() => {
        setMode(mode === "note" ? "mindmap" : "note")
      }}
    >
      {mode === "note" ? <ChartNoAxesGantt /> : <TableOfContents />}
    </div>
  )
}
