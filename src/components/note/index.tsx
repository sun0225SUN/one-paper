"use client"

import clsx from "clsx"
import { Fragment, useCallback } from "react"
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

  const renderNodes = useCallback(
    (parentId: string) => {
      return getChildNodes(nodes, parentId).map((node) => {
        const hasChildren = hasChildNodes(nodes, node.id)

        return (
          <Fragment key={node.id}>
            {/* current node */}
            <div
              onClick={() => {
                const element = document.getElementById(node.id)
                if (element && document.activeElement !== element) {
                  setCursorToEnd(node.id)
                }
              }}
              className={clsx(
                "group relative flex cursor-text items-center py-1",
                "before:absolute before:-left-6 before:top-0 before:h-full before:w-6 before:cursor-pointer before:content-['']",
              )}
            >
              <span className="relative size-2 cursor-pointer rounded-full bg-black dark:bg-white">
                {hasChildren && (
                  <>
                    <button
                      onClick={() => toggleNodeExpansion(node.id)}
                      className={clsx(
                        "absolute -top-[6px] right-3",
                        "hidden origin-center transition-transform duration-200 ease-in-out group-hover:block",
                        node.state.isExpanded ? "rotate-0" : "-rotate-90",
                      )}
                    >
                      <Triangle className="size-5 text-black dark:text-white" />
                    </button>
                    {!node.state.isExpanded && (
                      <span
                        className={clsx(
                          "absolute -left-1 -top-1 z-[-1] cursor-pointer",
                          "size-4 rounded-full bg-gray-300 dark:bg-gray-700",
                        )}
                      />
                    )}
                  </>
                )}
              </span>

              <span
                id={node.id}
                ref={(el) => {
                  if (el) el.textContent = node.content ?? ""
                }}
                contentEditable
                suppressContentEditableWarning
                className="ml-2 cursor-text outline-none"
                onInput={(e) => handleNodeContentChange(node.id, e)}
                onKeyDown={(e) => handleKeyDown(e, node.id)}
              />
            </div>

            {node.state.isExpanded !== false && (
              <div className="ml-[3px] border-l-2 border-gray-300 pl-6">
                {renderNodes(node.id)}
              </div>
            )}
          </Fragment>
        )
      })
    },
    [nodes, toggleNodeExpansion, handleNodeContentChange, handleKeyDown],
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
