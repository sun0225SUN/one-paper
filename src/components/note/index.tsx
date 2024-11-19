"use client"

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import type { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/types"
import clsx from "clsx"
import { Fragment, useCallback, useEffect, useState } from "react"
import Triangle from "~/assets/images/svg/triangle.svg"
import { useClient } from "~/hooks/use-client"
import { useNodeOperations } from "~/hooks/use-node-operations"
import { useNoteKeyboardHandlers } from "~/hooks/use-note-keyboard"
import { useNodeStore } from "~/store/node"
import {
  getChildNodes,
  hasChildNodes,
  setCursorToEnd,
} from "~/utils/node-actions"

// Types
interface DragPreviewState {
  element: HTMLDivElement | null
  updatePosition: (location: DragLocationHistory["current"]) => void
  show: (nodeCount: number, location: DragLocationHistory["current"]) => void
  hide: () => void
}

interface EmptyImageState {
  element: HTMLImageElement | null
}

type DropTarget = {
  type: "between" | "inside"
  nodeId: string
  index?: number
}

export function Note() {
  const GAP_THRESHOLD = 10

  const isClient = useClient()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  // Initialize drag preview with all its methods
  const [dragPreview, setDragPreview] = useState<DragPreviewState>(() => ({
    element: null,
    updatePosition: () => undefined,
    show: () => undefined,
    hide: () => undefined,
  }))

  // Initialize empty image for drag ghost
  const [emptyImage] = useState<EmptyImageState>(() => {
    if (typeof window === "undefined") return { element: null }
    const img = new window.Image()
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    return { element: img }
  })

  // Initialize drag preview element and its methods
  useEffect(() => {
    const element = document.createElement("div")
    element.className =
      "fixed pointer-events-none z-50 hidden rounded-md bg-white/90 px-3 text-sm font-medium shadow-lg backdrop-blur-sm dark:bg-black/90"
    element.style.willChange = "transform"
    document.body.appendChild(element)

    const preview: DragPreviewState = {
      element,
      updatePosition: (location) => {
        const { clientX, clientY } = location.input
        requestAnimationFrame(() => {
          if (!element) return
          element.style.transform = `translate3d(${clientX + 8}px, ${clientY + 8}px, 0)`
          element.style.left = "0"
          element.style.top = "0"
        })
      },
      show: (nodeCount, location) => {
        if (!element) return
        element.textContent = `${nodeCount} ${nodeCount === 1 ? "item" : "items"}`
        preview.updatePosition(location)
        element.style.display = "block"
      },
      hide: () => {
        if (!element) return
        element.style.display = "none"
      },
    }

    setDragPreview(preview)
    return () => element.remove()
  }, [])

  const { nodes, addNode, deleteNode, updateNode } = useNodeStore()

  // Count nodes including children (memoized)
  const countNodes = useCallback(
    (parentId: string): number => {
      const children = getChildNodes(nodes, parentId)
      return 1 + children.reduce((sum, child) => sum + countNodes(child.id), 0)
    },
    [nodes],
  )

  const { toggleNodeExpansion, handleNodeContentChange } = useNodeOperations({
    nodes,
    updateNode,
  })

  const { handleKeyDown } = useNoteKeyboardHandlers({
    nodes,
    addNode,
    deleteNode,
    updateNode,
  })

  // Check if target node is a descendant of source node
  const isDescendant = useCallback(
    (sourceId: string, targetId: string): boolean => {
      const isChild = (parentId: string): boolean => {
        if (targetId === parentId) return true
        const children = getChildNodes(nodes, parentId)
        return children.some((child) => isChild(child.id))
      }
      return isChild(sourceId)
    },
    [nodes],
  )

  // Handle node drop (memoized)
  const handleNodeDrop = useCallback(
    (sourceId: string, dropTarget: DropTarget) => {
      const sourceNode = nodes.find((node) => node.id === sourceId)
      if (!sourceNode || !dropTarget) return

      // Get target node
      const targetNode = nodes.find((node) => node.id === dropTarget.nodeId)
      if (!targetNode) return

      // Prevent dropping onto itself or its children
      if (isDescendant(sourceId, dropTarget.nodeId)) {
        return
      }

      // Update source node's parentId and priority
      if (dropTarget.type === "inside") {
        // Place inside target node
        const targetChildren = getChildNodes(nodes, dropTarget.nodeId)
        const newPriority =
          targetChildren.length > 0
            ? targetChildren[targetChildren.length - 1]!.priority + 10000
            : 1000000

        useNodeStore.getState().updateNode(sourceId, {
          ...sourceNode,
          parentId: dropTarget.nodeId,
          priority: newPriority,
        })
      } else {
        // Place between nodes
        const targetParentId = targetNode.parentId ?? "root"
        const siblings = getChildNodes(nodes, targetParentId)
        const targetIndex = dropTarget.index ?? siblings.length

        let newPriority: number

        if (targetIndex === 0) {
          // Place at first position
          newPriority = siblings[0] ? siblings[0].priority / 2 : 1000000
        } else if (targetIndex >= siblings.length) {
          // Place at last position
          newPriority = siblings[siblings.length - 1]!.priority + 10000
        } else {
          // Place between two nodes
          const prevNode = siblings[targetIndex - 1]!
          const nextNode = siblings[targetIndex]!
          newPriority =
            prevNode.priority + (nextNode.priority - prevNode.priority) / 2
        }

        useNodeStore.getState().updateNode(sourceId, {
          ...sourceNode,
          parentId: targetParentId,
          priority: newPriority,
        })
      }
    },
    [nodes, isDescendant],
  )

  // Setup drag handlers
  const setDragHandle = useCallback(
    (handle: HTMLSpanElement | null) => {
      if (!handle?.closest(".node-wrapper")) return

      const nodeWrapper = handle.closest(".node-wrapper")!

      // Make the node wrapper a drop target
      const dropTargetCleanup = dropTargetForElements({
        element: nodeWrapper,
        onDrag: ({ location }) => {
          // Check if there are inner target nodes
          const { clientX, clientY } = location.current.input
          const elementsAtPoint = document.elementsFromPoint(clientX, clientY)
          const nodeWrappers = elementsAtPoint.filter((el) =>
            el.classList.contains("node-wrapper"),
          )

          // If current node is not the innermost node, don't process
          if (nodeWrappers[0] !== nodeWrapper) {
            return
          }

          const nodeId = nodeWrapper
            .querySelector('[id^="content-"]')
            ?.id?.replace("content-", "")
          if (!nodeId || nodeId === draggingId?.replace("drag-handle-", ""))
            return

          const sourceId = draggingId?.replace("drag-handle-", "")
          if (!sourceId) return

          // Get relative position
          const mouseY = location.current.input.clientY
          const rect = nodeWrapper.getBoundingClientRect()
          const GAP_THRESHOLD = 2 // 2px gap threshold

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
            mouseY >= rect.top - GAP_THRESHOLD &&
            mouseY <= rect.top + GAP_THRESHOLD
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
            // Remove the check for the parent node, allowing dragging to any node inside
            setDropTarget({
              type: "inside",
              nodeId: currentNode.id,
            })
          }
        },
        onDragEnter: ({ location }) => {
          // Check if there are inner target nodes
          const { clientX, clientY } = location.current.input
          const elementsAtPoint = document.elementsFromPoint(clientX, clientY)
          const nodeWrappers = elementsAtPoint.filter((el) =>
            el.classList.contains("node-wrapper"),
          )

          // If current node is not the innermost node, don't process
          if (nodeWrappers[0] !== nodeWrapper) {
            return
          }

          const nodeId = nodeWrapper
            .querySelector('[id^="content-"]')
            ?.id?.replace("content-", "")
          if (!nodeId || nodeId === draggingId?.replace("drag-handle-", ""))
            return

          const sourceId = draggingId?.replace("drag-handle-", "")
          if (!sourceId) return

          // Get relative position
          const mouseY = location.current.input.clientY
          const rect = nodeWrapper.getBoundingClientRect()
          const GAP_THRESHOLD = 2 // 2px gap threshold

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
            mouseY >= rect.top - GAP_THRESHOLD &&
            mouseY <= rect.top + GAP_THRESHOLD
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
            // Remove the check for the parent node, allowing dragging to any node inside
            setDropTarget({
              type: "inside",
              nodeId: currentNode.id,
            })
          }
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

      const dragCleanup = draggable({
        element: nodeWrapper as HTMLElement,
        dragHandle: handle,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          if (!nativeSetDragImage || !emptyImage.element) return
          nativeSetDragImage(emptyImage.element, 0, 0)
        },
        onDragStart: (event) => {
          const nodeId = handle.id?.replace("drag-handle-", "")
          if (!nodeId) return

          setDraggingId(handle.id ?? null)
          const nodeCount = countNodes(nodeId)
          dragPreview.show(nodeCount, event.location.current)
        },
        onDrag: (event) => {
          dragPreview.updatePosition(event.location.current)
        },
        onDrop: () => {
          dragPreview.hide()
          // Don't clear draggingId here as we need it for the drop handler
        },
      })

      return () => {
        dropTargetCleanup()
        dragCleanup()
      }
    },
    [
      emptyImage.element,
      countNodes,
      dragPreview,
      draggingId,
      isDescendant,
      nodes,
      dropTarget,
      handleNodeDrop,
    ],
  )

  // Make root container a drop target for root-level drops
  useEffect(() => {
    const container = document.querySelector(".note-container")
    if (!container) return

    return dropTargetForElements({
      element: container,
      onDrag: ({ location }) => {
        if (!draggingId) return
        const rootNodes = getChildNodes(nodes, "root")

        // Get mouse position
        const mouseY = location.current.input.clientY
        const containerRect = container.getBoundingClientRect()

        // If mouse is above container, return
        if (mouseY < containerRect.top) return

        // Find the closest root node to the mouse
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
              mouseY >
                lastElement.getBoundingClientRect().bottom + GAP_THRESHOLD
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
      onDragEnter: ({ location }) => {
        if (!draggingId) return
        const rootNodes = getChildNodes(nodes, "root")

        // Get mouse position
        const mouseY = location.current.input.clientY
        const containerRect = container.getBoundingClientRect()

        // If mouse is above container, return
        if (mouseY < containerRect.top) return

        // Find the closest root node to the mouse
        let foundDropTarget = false
        for (let i = 0; i < rootNodes.length; i++) {
          const element = document
            .querySelector(`[id="content-${rootNodes[i]!.id}"]`)
            ?.closest(".node-wrapper")
          if (!element) continue

          const rect = element.getBoundingClientRect()
          const GAP_THRESHOLD = 2

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
              mouseY >
                lastElement.getBoundingClientRect().bottom + GAP_THRESHOLD
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
  }, [draggingId, nodes, dropTarget, handleNodeDrop])

  // Check if a node is part of the currently dragged tree (memoized)
  const isPartOfDraggedNode = useCallback(
    (nodeId: string): boolean => {
      if (!draggingId) return false
      return `drag-handle-${nodeId}` === draggingId
    },
    [draggingId],
  )

  const renderNodes = useCallback(
    (parentId: string) => {
      return getChildNodes(nodes, parentId).map((node) => {
        const hasChildren = hasChildNodes(nodes, node.id)

        return (
          <Fragment key={node.id}>
            {/* node wrapper */}
            <div
              className={clsx(
                "node-wrapper group relative rounded-sm pl-1 outline-blue-500",
                isPartOfDraggedNode(node.id) &&
                  "cursor-grabbing select-none !bg-[rgba(243,244,246,0.8)] !text-[rgba(0,0,0,0.5)] dark:!bg-[rgba(26,26,26,0.8)] dark:!text-[rgba(255,255,255,0.5)]",
                dropTarget?.nodeId === node.id && [
                  dropTarget.type === "inside" &&
                    "relative z-10 bg-blue-50 outline outline-2 outline-blue-500 dark:bg-blue-900/20",
                  dropTarget.type === "between" && [
                    dropTarget.index ===
                      getChildNodes(nodes, node.parentId ?? "root").findIndex(
                        (n) => n.id === node.id,
                      ) &&
                      "before:pointer-events-none before:absolute before:-top-[1px] before:left-0 before:z-20 before:h-[2px] before:w-full before:bg-blue-500 after:pointer-events-none after:absolute after:-left-[3px] after:-top-[3px] after:z-20 after:size-[6px] after:rounded-full after:bg-blue-500",
                    dropTarget.index ===
                      getChildNodes(nodes, node.parentId ?? "root").findIndex(
                        (n) => n.id === node.id,
                      ) +
                        1 &&
                      "before:pointer-events-none before:absolute before:-bottom-[1px] before:left-0 before:z-20 before:h-[2px] before:w-full before:bg-blue-500 after:pointer-events-none after:absolute after:-bottom-[3px] after:-left-[3px] after:z-20 after:size-[6px] after:rounded-full after:bg-blue-500",
                  ],
                ],
              )}
            >
              {/* current node */}
              <div
                onClick={() => {
                  const element = document.getElementById(node.id)
                  if (element && document.activeElement !== element) {
                    setCursorToEnd(node.id)
                  }
                }}
                className={clsx(
                  "group/outer",
                  "relative flex cursor-text items-center py-1",
                  "before:absolute before:-left-6 before:top-0 before:h-full before:w-6 before:cursor-pointer before:content-['']",
                )}
              >
                {/*  expand triangle */}
                {hasChildren && (
                  <button
                    onClick={() => toggleNodeExpansion(node.id)}
                    className={clsx(
                      "absolute -left-6 origin-center",
                      "hidden group-hover/outer:block",
                      "transition-transform duration-200 ease-in-out",
                      node.state.isExpanded ? "rotate-0" : "-rotate-90",
                    )}
                  >
                    <Triangle className="size-5 text-black dark:text-white" />
                  </button>
                )}

                {/* drag circle */}
                <span
                  ref={setDragHandle}
                  id={`drag-handle-${node.id}`}
                  className="group/inner relative size-5 cursor-grab"
                >
                  <span
                    className={clsx(
                      "absolute inset-0",
                      "size-5 rounded-full bg-gray-300 dark:bg-gray-700",
                      "opacity-0 transition-all duration-200 ease-in-out",
                      !node.state.isExpanded
                        ? "opacity-100"
                        : "group-hover/inner:opacity-100",
                    )}
                  />
                  <span className="absolute left-[6px] top-[6px] size-2 rounded-full bg-black dark:bg-white" />
                </span>

                {/* node content */}
                <span
                  id={`content-${node.id}`}
                  ref={(el) => {
                    if (el) el.textContent = node.content ?? ""
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full cursor-text pl-1 outline-none"
                  onInput={(e) => handleNodeContentChange(node.id, e)}
                  onKeyDown={(e) => handleKeyDown(e, node.id)}
                />
              </div>

              {/* child nodes */}
              {node.state.isExpanded !== false && (
                <div className="ml-[9px] border-l-2 border-gray-300 pl-6">
                  {renderNodes(node.id)}
                </div>
              )}
            </div>
          </Fragment>
        )
      })
    },
    [
      nodes,
      toggleNodeExpansion,
      handleNodeContentChange,
      handleKeyDown,
      setDragHandle,
      isPartOfDraggedNode,
      dropTarget,
    ],
  )

  if (!isClient) {
    return null
  }

  return (
    <div className="note-container mx-auto h-full w-full max-w-5xl p-10">
      {renderNodes("root")}
    </div>
  )
}
