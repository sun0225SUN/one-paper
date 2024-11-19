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

export function Note() {
  const isClient = useClient()
  const [draggingId, setDraggingId] = useState<string | null>(null)

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

  // Setup drag handlers
  const setDragHandle = useCallback(
    (handle: HTMLSpanElement | null) => {
      if (!handle?.closest(".node-wrapper")) return

      return draggable({
        element: handle.closest(".node-wrapper")!,
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
          setDraggingId(null)
        },
      })
    },
    [emptyImage.element, countNodes, dragPreview],
  )

  // Initialize drop target
  useEffect(() => {
    dropTargetForElements({ element: document.body })
  }, [])

  // Check if a node is part of the currently dragged tree (memoized)
  const isPartOfDraggedNode = useCallback(
    (nodeId: string): boolean => {
      if (!draggingId) return false
      const draggedNode = nodes.find(
        (node) => `drag-handle-${node.id}` === draggingId,
      )
      if (!draggedNode) return false

      const isChild = (parentId: string): boolean => {
        if (nodeId === parentId) return true
        const children = getChildNodes(nodes, parentId)
        return children.some((child) => isChild(child.id))
      }

      return isChild(draggedNode.id)
    },
    [draggingId, nodes],
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
                "node-wrapper rounded-sm pl-1 transition-all duration-200",
                isPartOfDraggedNode(node.id) &&
                  "cursor-grabbing select-none !bg-[rgba(243,244,246,0.8)] !text-[rgba(0,0,0,0.5)] dark:!bg-[rgba(26,26,26,0.8)] dark:!text-[rgba(255,255,255,0.5)]",
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
                  "group/outer relative flex cursor-text items-center py-1",
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
    ],
  )

  if (!isClient) {
    return null
  }

  return (
    <div className="mx-auto h-full w-full max-w-5xl p-10">
      {renderNodes("root")}
    </div>
  )
}
