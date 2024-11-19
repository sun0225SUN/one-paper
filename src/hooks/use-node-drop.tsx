import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { useCallback, useEffect } from "react"
import type { DropTarget, Node } from "~/types/node"

interface UseNodeDropProps {
  nodes: Node[]
  draggingId: string | null
  dropTarget: DropTarget | null
  isDescendant: (sourceId: string, targetId: string) => boolean
  getChildNodes: (nodes: Node[], parentId: string) => Node[]
  setDropTarget: (target: DropTarget | null) => void
  handleNodeDrop: (sourceId: string, target: DropTarget) => void
  setDraggingId: (id: string | null) => void
}

export function useNodeDrop({
  nodes,
  draggingId,
  dropTarget,
  isDescendant,
  getChildNodes,
  setDropTarget,
  handleNodeDrop,
  setDraggingId,
}: UseNodeDropProps) {
  // Distance in pixels that defines the "gap" area where nodes can be dropped between others
  const GAP_THRESHOLD = 8

  // Helper function to handle root container drag logic
  const handleRootContainerDrag = useCallback(
    (mouseY: number, container: Element) => {
      if (!draggingId) return
      const rootNodes = getChildNodes(nodes, "root")
      const containerRect = container.getBoundingClientRect()

      if (mouseY < containerRect.top) return

      let foundDropTarget = false
      for (let i = 0; i < rootNodes.length; i++) {
        const element = document
          .querySelector(`[id="content-${rootNodes[i]!.id}"]`)
          ?.closest(".node-wrapper")
        if (!element) continue

        const rect = element.getBoundingClientRect()

        // Skip if mouse is above this node
        if (mouseY < rect.top - GAP_THRESHOLD) continue

        // If mouse is in top gap
        if (mouseY <= rect.top + GAP_THRESHOLD) {
          setDropTarget({
            type: "between",
            nodeId: rootNodes[i]!.id,
            index: i,
          })
          foundDropTarget = true
          break
        }

        // If mouse is in bottom gap
        if (
          mouseY >= rect.bottom - GAP_THRESHOLD &&
          mouseY <= rect.bottom + GAP_THRESHOLD
        ) {
          setDropTarget({
            type: "between",
            nodeId: rootNodes[i]!.id,
            index: i + 1,
          })
          foundDropTarget = true
          break
        }

        // Skip if we haven't passed this node's bottom yet
        if (mouseY < rect.bottom) continue
      }

      // Only set bottom target if mouse is below all nodes and we haven't found another target
      if (!foundDropTarget && mouseY >= containerRect.top) {
        const lastNode = rootNodes[rootNodes.length - 1]
        if (lastNode) {
          const lastElement = document
            .querySelector(`[id="content-${lastNode.id}"]`)
            ?.closest(".node-wrapper")

          if (
            lastElement &&
            mouseY > lastElement.getBoundingClientRect().bottom + GAP_THRESHOLD
          ) {
            setDropTarget({
              type: "between",
              nodeId: lastNode.id,
              index: rootNodes.length,
            })
          }
        }
      }
    },
    [draggingId, nodes, getChildNodes, GAP_THRESHOLD, setDropTarget],
  )

  // Helper function to handle individual node drag logic
  const handleNodeDrag = useCallback(
    (nodeWrapper: HTMLElement, clientX: number, clientY: number) => {
      const elementsAtPoint = document.elementsFromPoint(clientX, clientY)
      const nodeWrappers = elementsAtPoint.filter((el) =>
        el.classList.contains("node-wrapper"),
      )

      if (nodeWrappers[0] !== nodeWrapper) return

      const nodeId = nodeWrapper
        .querySelector('[id^="content-"]')
        ?.id?.replace("content-", "")
      if (!nodeId || nodeId === draggingId?.replace("drag-handle-", "")) return

      const sourceId = draggingId?.replace("drag-handle-", "")
      if (!sourceId) return

      // Get relative position
      const mouseY = clientY
      const rect = nodeWrapper.getBoundingClientRect()

      // Prevent dropping onto itself or its children
      if (sourceId === nodeId || isDescendant(sourceId, nodeId)) {
        return
      }

      // Get current node's parent node
      const currentNode = nodes.find((n) => n.id === nodeId)
      if (!currentNode) return

      // Get all sibling nodes
      const siblings = getChildNodes(nodes, currentNode.parentId ?? "root")
      const currentIndex = siblings.findIndex((n) => n.id === nodeId)

      // Check if in the top gap of the node
      const isInTopGap =
        mouseY >= rect.top - GAP_THRESHOLD && mouseY <= rect.top + GAP_THRESHOLD
      // Check if in the bottom gap of the node
      const isInBottomGap =
        mouseY >= rect.bottom - GAP_THRESHOLD &&
        mouseY <= rect.bottom + GAP_THRESHOLD

      if (isInTopGap) {
        // In the top gap, insert before the node
        setDropTarget({
          type: "between",
          nodeId: currentNode.id,
          index: currentIndex,
        })
      } else if (isInBottomGap) {
        // In the bottom gap, insert after the node
        setDropTarget({
          type: "between",
          nodeId: currentNode.id,
          index: currentIndex + 1,
        })
      } else if (
        mouseY > rect.top + GAP_THRESHOLD &&
        mouseY < rect.bottom - GAP_THRESHOLD
      ) {
        // Inside the node
        setDropTarget({
          type: "inside",
          nodeId: currentNode.id,
        })
      }
    },
    [
      nodes,
      draggingId,
      isDescendant,
      getChildNodes,
      GAP_THRESHOLD,
      setDropTarget,
    ],
  )

  // Root container drop handling
  useEffect(() => {
    const container = document.querySelector(".note-container")
    if (!container) return

    return dropTargetForElements({
      element: container,
      // Handle continuous dragging over the container
      onDrag: ({ location }) => {
        handleRootContainerDrag(location.current.input.clientY, container)
      },
      // Handle initial drag enter
      onDragEnter: ({ location }) => {
        handleRootContainerDrag(location.current.input.clientY, container)
      },
      // Clear drop target when dragging outside the container
      onDragLeave: (event) => {
        // Only clear if we're actually leaving the container area
        const container = document.querySelector(".note-container")
        const rect = container?.getBoundingClientRect()
        if (!rect) return

        const { clientX, clientY } = event.location.current.input
        if (
          clientX < rect.left - 10 ||
          clientX > rect.right + 10 ||
          clientY < rect.top - 10 ||
          clientY > rect.bottom + 10
        ) {
          setDropTarget(null)
        }
      },
      // Handle the final drop operation
      onDrop: () => {
        if (draggingId && dropTarget) {
          const sourceId = draggingId.replace("drag-handle-", "")
          handleNodeDrop(sourceId, dropTarget)
        }
        setDropTarget(null)
        setDraggingId(null)
      },
    })
  }, [
    handleRootContainerDrag,
    draggingId,
    dropTarget,
    setDropTarget,
    setDraggingId,
    nodes,
    isDescendant,
    getChildNodes,
    handleNodeDrop,
  ])

  // Individual node drop handling
  return useCallback(
    (nodeWrapper: HTMLElement) => {
      return dropTargetForElements({
        element: nodeWrapper,
        // Similar handlers as the root container, but for individual nodes
        onDrag: ({ location }) => {
          handleNodeDrag(
            nodeWrapper,
            location.current.input.clientX,
            location.current.input.clientY,
          )
        },
        onDragEnter: ({ location }) => {
          handleNodeDrag(
            nodeWrapper,
            location.current.input.clientX,
            location.current.input.clientY,
          )
        },
        onDragLeave: (event) => {
          // Only clear if we're actually leaving the container area
          const container = document.querySelector(".note-container")
          const rect = container?.getBoundingClientRect()
          if (!rect) return

          const { clientX, clientY } = event.location.current.input
          if (
            clientX < rect.left - 10 ||
            clientX > rect.right + 10 ||
            clientY < rect.top - 10 ||
            clientY > rect.bottom + 10
          ) {
            setDropTarget(null)
          }
        },
        onDrop: () => {
          if (draggingId && dropTarget) {
            const sourceId = draggingId.replace("drag-handle-", "")
            handleNodeDrop(sourceId, dropTarget)
          }
          setDropTarget(null)
          setDraggingId(null)
        },
      })
    },
    [
      handleNodeDrag,
      setDropTarget,
      draggingId,
      dropTarget,
      setDraggingId,
      handleNodeDrop,
    ],
  )
}
