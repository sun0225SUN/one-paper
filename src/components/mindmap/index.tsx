"use client"

import { Download } from "lucide-react"
import { Transformer } from "markmap-lib"
import { Toolbar } from "markmap-toolbar"
import { Markmap } from "markmap-view"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { useNodeStore } from "~/store/node"
import "~/styles/mindmap.css"
import { transformToMarkdown } from "~/utils/data-convert"
import { downloadElementAsPng } from "~/utils/download-image"

export function Mindmap() {
  const { nodes } = useNodeStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<{ el: HTMLElement } | null>(null)
  const { resolvedTheme } = useTheme()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!containerRef.current) return
    setDownloading(true)

    // hide toolbar and show watermark
    const toolbar = toolbarRef.current?.el
    const downloadButton = document.querySelector(".download")
    if (toolbar) toolbar.style.display = "none"

    if (downloadButton instanceof HTMLElement)
      downloadButton.style.display = "none"

    await downloadElementAsPng(containerRef.current, "OnePaper-Mindmap.png", {
      backgroundColor: resolvedTheme === "dark" ? "#09090b" : "#ffffff",
    })

    // restore toolbar and hide watermark
    if (toolbar) toolbar.style.display = ""
    if (downloadButton instanceof HTMLElement) downloadButton.style.display = ""

    setDownloading(false)
  }

  useEffect(() => {
    const markdown = transformToMarkdown(nodes)
    const transformer = new Transformer()
    const { root } = transformer.transform(markdown)

    const currentSvg = svgRef.current
    const currentContainer = containerRef.current

    if (!currentSvg || !currentContainer) return

    currentSvg.innerHTML = ""

    const mm = Markmap.create(
      currentSvg,
      {
        color: () => "#5756cd",
        spacingVertical: 10,
        spacingHorizontal: 80,
        duration: 300,
      },
      root,
    )

    toolbarRef.current?.el?.remove()
    toolbarRef.current = Toolbar.create(mm)
    currentContainer.appendChild(toolbarRef.current.el)

    // Add fullscreen button to toolbar
    const fullscreenButton = document.createElement("button")
    fullscreenButton.style.paddingLeft = "4px"
    // Expand/collapse icon SVG
    fullscreenButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-expand"><path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0 0h4.8M3 21l6-6"/><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/><path d="M3 7.8V3m0 0h4.8M3 3l6 6"/></svg>`

    // Toggle fullscreen mode
    fullscreenButton.onclick = () => {
      if (!document.fullscreenElement) {
        void currentSvg.requestFullscreen()
      } else {
        void document.exitFullscreen()
      }
    }
    toolbarRef.current.el.appendChild(fullscreenButton)

    // Cleanup function
    return () => {
      toolbarRef.current?.el?.remove()
      toolbarRef.current = null
    }
  }, [nodes, resolvedTheme])

  return (
    <div className="relative" style={{ height: "calc(100vh - 64px)" }}>
      <div className="relative mx-auto h-full w-full" ref={containerRef}>
        <svg
          ref={svgRef}
          style={{ width: "100%", height: "calc(100% - 72px)" }}
        />
        <div className="one-paper absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
          - Created By OnePaper -
        </div>
        <button
          className="download absolute bottom-6 left-60 z-10"
          onClick={handleDownload}
          disabled={downloading}
        >
          {!downloading && <Download size={20} />}
        </button>
      </div>
    </div>
  )
}
