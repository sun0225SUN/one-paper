import { nanoid } from "nanoid"
import { type Node } from "~/types/node"

/**
 * Get child nodes and sort them by priority
 * @param nodes - Array of all nodes
 * @param parentId - ID of the parent node
 * @returns Sorted array of child nodes
 */
export const getChildNodes = (nodes: Node[], parentId: string) => {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Check if a node has any children
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to check
 * @returns Boolean indicating whether the node has children
 */
export const hasChildNodes = (nodes: Node[], nodeId: string) => {
  return nodes.some((node) => node.parentId === nodeId)
}

/**
 * Create a new node with default values
 * @param parentId - ID of the parent node
 * @param prevNodePriority - Priority of the previous node (optional)
 * @param nextNodePriority - Priority of the next node (optional)
 * @returns New node object with default properties
 */
export const createDefaultNode = (
  parentId: string,
  prevNodePriority?: number,
  nextNodePriority?: number,
): Node => {
  let priority: number

  if (prevNodePriority === undefined) {
    // If it's the first node
    priority = nextNodePriority ? nextNodePriority / 2 : 1000000
  } else if (nextNodePriority === undefined) {
    // If it's the last node
    priority = prevNodePriority + 10000
  } else {
    // Between two nodes, use binary search method
    priority = prevNodePriority + (nextNodePriority - prevNodePriority) / 2
  }

  return {
    id: nanoid(),
    parentId,
    content: "",
    priority,
    metadata: { type: "text" },
    state: { isExpanded: true, isCompleted: false },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Get all visible nodes in the tree structure
 * @param nodes - Array of all nodes in the note
 * @returns Array of node IDs in display order
 */
export const getAllVisibleNodes = (nodes: Node[]): string[] => {
  const visibleNodes: string[] = []
  const traverse = (parentId: string) => {
    const children = getChildNodes(nodes, parentId)
    children.forEach((node) => {
      visibleNodes.push(node.id)
      if (node.state.isExpanded !== false) {
        traverse(node.id)
      }
    })
  }
  traverse("root")
  return visibleNodes
}

/**
 * Set cursor to the end of the node
 * @param nodeId - The ID of the node to set the cursor to
 */
export const setCursorToEnd = (nodeId: string) => {
  setTimeout(() => {
    const el = document.getElementById(nodeId)
    if (el) {
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(el)
      range.collapse(false)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, 0)
}
