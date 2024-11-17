"use client"

import { Fragment, useCallback } from "react"
import { useClient } from "~/hooks/use-client"
import { useNodeOperations } from "~/hooks/use-node-operations"
import { useNoteKeyboardHandlers } from "~/hooks/use-note-keyboard"
import { useNodeStore } from "~/store/node"
import { getChildNodes, hasChildNodes } from "~/utils/node-actions"

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
            <div className="group relative flex cursor-text justify-between gap-2 py-1 before:absolute before:-left-6 before:top-0 before:h-full before:w-6 before:cursor-pointer before:content-['']">
              <div className="flex items-center gap-2">
                {/* circle */}
                <span className="relative size-2 cursor-pointer rounded-full bg-black dark:bg-white">
                  {hasChildren && (
                    <>
                      {/* expand button */}
                      <div className="hidden h-10 w-10 items-center justify-center group-hover:flex">
                        <button
                          onClick={() => toggleNodeExpansion(node.id)}
                          className={`absolute right-5 top-0 origin-center border-b-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-black transition-transform duration-200 ease-in-out dark:border-t-white ${
                            node.state.isExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </div>

                      {/* hover circle */}
                      {!node.state.isExpanded && (
                        <span className="absolute -left-1 -top-1 z-[-1] size-4 cursor-pointer rounded-full bg-gray-300 dark:bg-gray-700" />
                      )}
                    </>
                  )}
                </span>

                {/* content */}
                <span
                  id={node.id}
                  ref={(el) => {
                    if (el) el.textContent = node.content ?? ""
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  className="cursor-text outline-none"
                  onInput={(e) => handleNodeContentChange(node.id, e)}
                  onKeyDown={(e) => handleKeyDown(e, node.id)}
                />
              </div>
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
