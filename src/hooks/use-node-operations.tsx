import { useCallback } from "react"
import { useNodeStore } from "~/store/node"
import type { DropTarget, Node } from "~/types/node"
import { getChildNodes } from "~/utils/node-operations"

interface UseNodeOperationsProps {
  nodes: Node[]
  updateNode: (nodeId: string, node: Node) => void
}

/**
 * Custom hook for handling node operations like expansion and content changes
 */
export function useNodeOperations({
  nodes,
  updateNode,
}: UseNodeOperationsProps) {
  /**
   * Toggles the expansion state of a node
   * @param nodeId - The ID of the node to toggle
   */
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

  /**
   * Handles content changes in a node
   * @param nodeId - The ID of the node being edited
   * @param event - The form event containing the new content
   */
  const handleNodeContentChange = useCallback(
    (nodeId: string, event: React.FormEvent<HTMLSpanElement>) => {
      const target = event.currentTarget
      if (!target) return

      const content = target.textContent ?? ""
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return

      updateNode(nodeId, { ...node, content })
    },
    [nodes, updateNode],
  )

  return {
    toggleNodeExpansion,
    handleNodeContentChange,
  }
}

interface UseNodeDndProps {
  nodes: Node[]
  draggingId: string | null
}

/**
 * Custom hook for handling node drag and drop operations
 */
export function useNodeDnd({ nodes, draggingId }: UseNodeDndProps) {
  /*
   * Recursively counts total number of nodes under a given parent
   * including the parent node itself
   * Returns: total count of nodes in the tree branch
   */
  const countNodes = useCallback(
    (parentId: string): number => {
      const children = getChildNodes(nodes, parentId)
      return 1 + children.reduce((sum, child) => sum + countNodes(child.id), 0)
    },
    [nodes],
  )

  /*
   * Checks if targetId is a descendant of sourceId in the node tree
   * Used to prevent dropping a node into its own children
   * Returns: boolean indicating if target is a descendant
   */
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

  /*
   * Handles the logic when a node is dropped onto a target
   * Supports two drop types:
   * 1. "inside" - Drop node as a child of target
   * 2. "between" - Drop node between existing nodes
   *
   * For "inside" drops:
   * - Adds node as last child with increased priority
   *
   * For "between" drops:
   * - Calculates new priority based on surrounding nodes
   * - Handles special cases for first/last positions
   */
  const handleNodeDrop = useCallback(
    (sourceId: string, dropTarget: DropTarget) => {
      const sourceNode = nodes.find((node) => node.id === sourceId)
      if (!sourceNode || !dropTarget) return

      const targetNode = nodes.find((node) => node.id === dropTarget.nodeId)
      if (!targetNode) return

      if (isDescendant(sourceId, dropTarget.nodeId)) {
        return
      }

      if (dropTarget.type === "inside") {
        /* Calculate priority for inserting as last child */
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
        /* Calculate priority for inserting between nodes */
        const targetParentId = targetNode.parentId ?? "root"
        const siblings = getChildNodes(nodes, targetParentId)
        const targetIndex = dropTarget.index ?? siblings.length

        let newPriority: number

        if (targetIndex === 0) {
          /* First position: half of first node's priority */
          newPriority = siblings[0] ? siblings[0].priority / 2 : 1000000
        } else if (targetIndex >= siblings.length) {
          /* Last position: increment last node's priority */
          newPriority = siblings[siblings.length - 1]!.priority + 10000
        } else {
          /* Between nodes: average of surrounding priorities */
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

  /*
   * Checks if a given node is part of the currently dragged tree
   * Used for visual feedback during drag operations
   * Returns: boolean indicating if node is being dragged
   */
  const isPartOfDraggedNode = useCallback(
    (nodeId: string): boolean => {
      if (!draggingId) return false
      return `drag-handle-${nodeId}` === draggingId
    },
    [draggingId],
  )

  return {
    countNodes,
    isDescendant,
    handleNodeDrop,
    isPartOfDraggedNode,
  }
}
