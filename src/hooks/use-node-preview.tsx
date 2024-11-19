import { type DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/types"
import { useCallback, useEffect, useState } from "react"

/**
 * A custom hook that manages a drag preview element for showing the number of items being dragged
 * Returns utilities for showing, updating position, and hiding the preview
 */
export function useNodePreview() {
  // Create an empty 1x1 transparent GIF image to hide the default drag preview
  const [emptyImage] = useState<{ element: HTMLImageElement | null }>(() => {
    if (typeof window === "undefined") return { element: null }
    const img = new window.Image()
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    return { element: img }
  })

  // State to hold the drag preview DOM element
  const [dragPreviewElement, setDragPreviewElement] =
    useState<HTMLDivElement | null>(null)

  // Create and inject the drag preview element into the DOM
  useEffect(() => {
    const element = document.createElement("div")
    // Apply Tailwind classes for styling the preview element
    element.className =
      "fixed pointer-events-none z-[9999] hidden rounded-md bg-white/90 px-3 py-1 text-sm font-medium text-black shadow-lg backdrop-blur-sm dark:bg-zinc-800/90 dark:text-white"
    element.style.willChange = "transform"
    element.style.position = "fixed"
    element.style.top = "0"
    element.style.left = "0"
    document.body.appendChild(element)

    setDragPreviewElement(element)
    return () => element.remove()
  }, [])

  // Update the preview element's position based on cursor location
  const updatePreviewPosition = useCallback(
    (location: DragLocationHistory["current"]) => {
      if (!dragPreviewElement) return
      const { clientX, clientY } = location.input
      requestAnimationFrame(() => {
        dragPreviewElement.style.transform = `translate3d(${clientX + 10}px, ${clientY + 10}px, 0)`
      })
    },
    [dragPreviewElement],
  )

  // Show the preview with the count of dragged items
  const showPreview = useCallback(
    (nodeCount: number, location: DragLocationHistory["current"]) => {
      if (!dragPreviewElement) return

      const { clientX, clientY } = location.input
      dragPreviewElement.style.transform = `translate3d(${clientX + 10}px, ${clientY + 10}px, 0)`

      dragPreviewElement.innerHTML = `<span>${nodeCount} ${nodeCount === 1 ? "item" : "items"}</span>`
      dragPreviewElement.style.display = "block"
      dragPreviewElement.style.visibility = "visible"
    },
    [dragPreviewElement],
  )

  // Hide the preview element
  const hidePreview = useCallback(() => {
    if (!dragPreviewElement) return
    dragPreviewElement.style.display = "none"
  }, [dragPreviewElement])

  // Return utilities for controlling the preview
  return {
    emptyImage: emptyImage.element,
    showPreview,
    updatePreviewPosition,
    hidePreview,
  }
}
