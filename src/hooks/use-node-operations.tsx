import { useCallback } from "react"
import type { Node } from "~/types/node"

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
