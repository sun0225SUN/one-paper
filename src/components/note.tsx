"use client"

import { Fragment, useCallback } from "react"
import { useNodeStore } from "~/store/node"
import {
  getChildNodes,
  hasChildNodes,
  createDefaultNode,
} from "~/utils/node-actions"

export default function Note() {
  const { nodes, addNode, updateNode } = useNodeStore()

  const toggleNodeExpansion = useCallback(
    (nodeId: string) => {
      const node = nodes.find((node) => node.id === nodeId)
      if (!node) return

      updateNode(nodeId, {
        ...node,
        state: {
          ...node.state,
          isExpanded: !node.state.isExpanded,
        },
      })
    },
    [nodes, updateNode],
  )

  const handleNodeAdd = useCallback(
    (parentId: string) => {
      addNode(createDefaultNode(parentId))
    },
    [addNode],
  )

  const renderNodes = useCallback(
    (parentId: string) => {
      return getChildNodes(nodes, parentId).map((node) => {
        const hasChildren = hasChildNodes(nodes, node.id)

        return (
          <Fragment key={node.id}>
            <div className="group relative flex cursor-text justify-between gap-2 py-1 before:absolute before:-left-6 before:top-0 before:h-full before:w-6 before:content-['']">
              <div className="flex items-center gap-2">
                <span className="relative size-2 rounded-full bg-black dark:bg-white">
                  {hasChildren && (
                    <>
                      <div className="hidden h-8 w-8 items-center justify-center group-hover:flex">
                        <button
                          onClick={() => toggleNodeExpansion(node.id)}
                          className={`absolute right-4 top-0 origin-center border-b-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-black transition-transform duration-200 ease-in-out ${
                            node.state.isExpanded ? "-rotate-90" : "rotate-0"
                          }`}
                        />
                      </div>
                      {!node.state.isExpanded && (
                        <span className="absolute -left-1 -top-1 z-[-1] size-4 rounded-full bg-gray-300" />
                      )}
                    </>
                  )}
                </span>

                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="cursor-text outline-none"
                >
                  {node.content ?? ""}
                </span>
              </div>

              <button
                onClick={() => handleNodeAdd(node.id)}
                className="opacity-0 group-hover:opacity-100"
              >
                +
              </button>
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
    [nodes, toggleNodeExpansion, handleNodeAdd],
  )

  return (
    <div className="mx-auto h-full w-full max-w-5xl p-10">
      {renderNodes("root")}
    </div>
  )
}
