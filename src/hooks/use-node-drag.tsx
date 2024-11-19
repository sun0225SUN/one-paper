import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { useCallback } from "react"
import { useNodePreview } from "~/hooks/use-node-preview"

// Custom hook for handling node drag functionality
interface UseNodeDragProps {
  // Function to count the number of nodes for a given nodeId
  countNodes: (nodeId: string) => number
  // Function to set the currently dragging node ID
  setDraggingId: (id: string | null) => void
}

export function useNodeDrag({ countNodes, setDraggingId }: UseNodeDragProps) {
  // Get preview-related utilities from useNodePreview hook
  const { emptyImage, showPreview, updatePreviewPosition, hidePreview } =
    useNodePreview()

  return useCallback(
    (nodeWrapper: HTMLElement, handle: HTMLElement) => {
      return draggable({
        element: nodeWrapper,
        dragHandle: handle,
        // Set up an empty drag image to hide the default browser preview
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          if (!nativeSetDragImage || !emptyImage) return
          nativeSetDragImage(emptyImage, 0, 0)
        },
        // Handle drag start: extract node ID, set dragging state, and show preview
        onDragStart: (event) => {
          const nodeId = handle.id?.replace("drag-handle-", "")
          if (!nodeId) return

          setDraggingId(handle.id ?? null)
          const nodeCount = countNodes(nodeId)
          showPreview(nodeCount, event.location.current)
        },
        // Update preview position during drag
        onDrag: (event) => {
          updatePreviewPosition(event.location.current)
        },
        // Clean up preview when drag ends
        onDrop: hidePreview,
      })
    },
    [
      emptyImage,
      setDraggingId,
      countNodes,
      showPreview,
      updatePreviewPosition,
      hidePreview,
    ],
  )
}
