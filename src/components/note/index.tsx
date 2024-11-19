"use client"

import { useCallback, useState } from "react"
import { useClient } from "~/hooks/use-client"
import { useNodeDrag } from "~/hooks/use-node-drag"
import { useNodeDrop } from "~/hooks/use-node-drop"
import { useNodeDnd, useNodeOperations } from "~/hooks/use-node-operations"
import { useNoteKeyboardHandlers } from "~/hooks/use-note-keyboard"
import { useNodeStore } from "~/store/node"
import { type DropTarget } from "~/types/node"
import { getChildNodes, hasChildNodes } from "~/utils/node-operations"
import { Node } from "./node"

export function Note() {
  // node store
  const { nodes, addNode, deleteNode, updateNode } = useNodeStore()

  // node operations
  const { toggleNodeExpansion, handleNodeContentChange } = useNodeOperations({
    nodes,
    updateNode,
  })
  const { handleKeyDown } = useNoteKeyboardHandlers({
    nodes,
    addNode,
    deleteNode,
    updateNode,
  }) as {
    handleKeyDown: (e: React.KeyboardEvent<Element>, id: string) => void
  }

  // drag and drop
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const { countNodes, isDescendant, handleNodeDrop, isPartOfDraggedNode } =
    useNodeDnd({
      nodes,
      draggingId,
    })
  const nodeDrag = useNodeDrag({
    countNodes,
    setDraggingId,
  })
  const nodeDrop = useNodeDrop({
    nodes,
    draggingId,
    dropTarget,
    isDescendant,
    getChildNodes,
    setDropTarget,
    handleNodeDrop,
    setDraggingId,
  })
  const setDragHandle = useCallback(
    (handle: HTMLSpanElement | null) => {
      if (!handle?.closest(".node-wrapper")) return
      const nodeWrapper = handle.closest(".node-wrapper")!

      const dropCleanup = nodeDrop(nodeWrapper as HTMLElement)
      const dragCleanup = nodeDrag(nodeWrapper as HTMLElement, handle)

      return () => {
        dropCleanup()
        dragCleanup()
      }
    },
    [nodeDrag, nodeDrop],
  )

  const renderNodes = useCallback(
    (parentId: string) => {
      return getChildNodes(nodes, parentId).map((node) => {
        const hasChildren = hasChildNodes(nodes, node.id)

        return (
          <Node
            key={node.id}
            node={node}
            hasChildren={hasChildren}
            isPartOfDraggedNode={isPartOfDraggedNode}
            dropTarget={dropTarget}
            toggleNodeExpansion={toggleNodeExpansion}
            handleNodeContentChange={handleNodeContentChange}
            handleKeyDown={handleKeyDown}
            setDragHandle={setDragHandle}
            renderNodes={renderNodes}
            nodes={nodes}
          />
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

  const isClient = useClient()

  if (!isClient) {
    return null
  }

  return (
    <div className="note-container mx-auto h-full w-full max-w-5xl p-10">
      {renderNodes("root")}
    </div>
  )
}
