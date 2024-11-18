import { useCallback } from "react"
import type { Node } from "~/types/node"
import {
  createDefaultNode,
  getAllVisibleNodes,
  getChildNodes,
  setCursorToEnd,
} from "~/utils/node-actions"

/**
 * Props interface for the useNoteKeyboardHandlers hook
 */
interface UseNoteKeyboardHandlersProps {
  nodes: Node[] // Array of all nodes in the note
  addNode: (node: Node) => void // Function to add a new node
  deleteNode: (nodeId: string) => void // Function to delete a node
  updateNode: (nodeId: string, node: Node) => void // Function to update a node
}

/**
 * Custom hook to handle keyboard interactions in the note editor
 * Manages operations like creating, deleting, and navigating between nodes
 */
export function useNoteKeyboardHandlers({
  nodes,
  addNode,
  deleteNode,
  updateNode,
}: UseNoteKeyboardHandlersProps) {
  /**
   * Handles Enter key press
   * Creates a new node with the same type as the current node
   */
  const handleEnterKey = useCallback(
    (currentNode: Node) => {
      // Get all siblings of the current node
      const siblings = getChildNodes(nodes, currentNode.parentId)
      const currentIndex = siblings.findIndex(
        (node) => node.id === currentNode.id,
      )

      // Get priorities of adjacent nodes
      const prevNodePriority = currentNode.priority
      const nextNode = siblings[currentIndex + 1]
      const nextNodePriority = nextNode?.priority

      const newNode = {
        ...createDefaultNode(
          currentNode.parentId,
          prevNodePriority,
          nextNodePriority,
        ),
        metadata: {
          type: currentNode.metadata.type,
        },
      }
      addNode(newNode)
      setCursorToEnd(newNode.id)
    },
    [addNode, nodes],
  )

  /**
   * Handles Backspace key press when node is empty
   * Deletes the current node and moves focus to the previous sibling or parent
   */
  const handleBackspaceKey = useCallback(
    (currentNode: Node, nodeId: string) => {
      if (currentNode.content !== "") return

      const hasChildren = getChildNodes(nodes, nodeId).length > 0
      if (hasChildren) return

      const visibleNodes = getAllVisibleNodes(nodes)
      const currentIndex = visibleNodes.indexOf(nodeId)
      if (currentIndex > 0) {
        const targetNodeId = visibleNodes[currentIndex - 1]
        setCursorToEnd(targetNodeId ?? "")
        deleteNode(nodeId)
      }
    },
    [nodes, deleteNode],
  )

  /**
   * Handles Tab key press
   * Shift+Tab: Moves node up one level in hierarchy
   * Tab: Makes node a child of previous sibling
   */
  const handleTabKey = useCallback(
    (currentNode: Node, nodeId: string, isShiftKey: boolean) => {
      const siblings = getChildNodes(nodes, currentNode.parentId)
      const currentIndex = siblings.findIndex((n) => n.id === nodeId)

      if (isShiftKey) {
        // Move node up to parent's level
        const parentNode = nodes.find((n) => n.id === currentNode.parentId)
        if (!parentNode || parentNode.id === "root") return

        // Get parent's siblings to calculate new priority
        const parentSiblings = getChildNodes(nodes, parentNode.parentId)
        const parentIndex = parentSiblings.findIndex(
          (n) => n.id === parentNode.id,
        )
        const nextParentSibling = parentSiblings[parentIndex + 1]

        updateNode(nodeId, {
          ...currentNode,
          parentId: parentNode.parentId,
          priority:
            parentNode.priority +
            (nextParentSibling
              ? (nextParentSibling.priority - parentNode.priority) / 2
              : 0),
        })
        setCursorToEnd(nodeId)
      } else {
        // Make node a child of previous sibling
        const newParent = siblings[currentIndex - 1]
        if (!newParent) return

        // Check if new parent has children
        const newParentChildren = getChildNodes(nodes, newParent.id)
        const newPriority =
          newParentChildren.length > 0
            ? newParentChildren[newParentChildren.length - 1]!.priority + 10000
            : newParent?.priority

        updateNode(nodeId, {
          ...currentNode,
          parentId: newParent.id,
          priority: newPriority,
        })
        setCursorToEnd(nodeId)
      }
    },
    [nodes, updateNode],
  )

  /**
   * Handles Arrow key presses (Up/Down)
   * Navigates through visible nodes in the tree structure
   * Respects collapsed/expanded state of nodes
   */
  const handleArrowKeys = useCallback(
    (nodeId: string, isUpKey: boolean) => {
      const visibleNodes = getAllVisibleNodes(nodes)
      const currentIndex = visibleNodes.indexOf(nodeId)
      if (currentIndex === -1) return

      const targetIndex = isUpKey ? currentIndex - 1 : currentIndex + 1
      if (targetIndex >= 0 && targetIndex < visibleNodes.length) {
        const targetNodeId = visibleNodes[targetIndex]
        setCursorToEnd(targetNodeId ?? "")
      }
    },
    [nodes],
  )

  /**
   * Main keyboard event handler
   * Delegates to specific handlers based on key pressed
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>, nodeId: string) => {
      const currentNode = nodes.find((n) => n.id === nodeId)
      if (!currentNode) return

      switch (event.key) {
        case "Enter": {
          event.preventDefault()
          handleEnterKey(currentNode)
          break
        }

        case "Backspace": {
          if (currentNode.content === "") {
            event.preventDefault()
            handleBackspaceKey(currentNode, nodeId)
          }
          break
        }

        case "Tab": {
          event.preventDefault()
          handleTabKey(currentNode, nodeId, event.shiftKey)
          break
        }

        case "ArrowUp":
        case "ArrowDown": {
          event.preventDefault()
          handleArrowKeys(nodeId, event.key === "ArrowUp")
          break
        }
      }
    },
    [nodes, handleEnterKey, handleBackspaceKey, handleTabKey, handleArrowKeys],
  )

  return { handleKeyDown }
}
