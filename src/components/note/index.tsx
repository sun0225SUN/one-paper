"use client"

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
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

export function Note() {
  const isClient = useClient()
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const { nodes, addNode, deleteNode, updateNode } = useNodeStore()

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

  const setDragHandle = useCallback((handle: HTMLSpanElement | null) => {
    if (!handle?.closest(".node-wrapper")) return

    return draggable({
      element: handle.closest(".node-wrapper")!,
      dragHandle: handle,
      onDragStart: () => setDraggingId(handle.id ?? null),
      onDrop: () => setDraggingId(null),
    })
  }, [])

  useEffect(() => dropTargetForElements({ element: document.body }), [])

  const isPartOfDraggedNode = useCallback(
    (nodeId: string) => {
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
            <div
              className={clsx(
                "node-wrapper rounded-sm bg-white pl-6 dark:bg-black",
                isPartOfDraggedNode(node.id) &&
                  "bg-gray-100 text-gray-500 dark:bg-[#1a1a1a] dark:text-gray-400",
              )}
            >
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

              {node.state.isExpanded !== false && (
                <div className="ml-[9px] border-l-2 border-gray-300">
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
