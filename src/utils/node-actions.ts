import { type Node } from "~/types/node";
import { nanoid } from "nanoid";

/**
 * Get child nodes and sort them by priority
 * @param nodes - Array of all nodes
 * @param parentId - ID of the parent node
 * @returns Sorted array of child nodes
 */
export const getChildNodes = (nodes: Node[], parentId: string) => {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.priority - b.priority);
};

/**
 * Check if a node has any children
 * @param nodes - Array of all nodes
 * @param nodeId - ID of the node to check
 * @returns Boolean indicating whether the node has children
 */
export const hasChildNodes = (nodes: Node[], nodeId: string) => {
  return nodes.some((node) => node.parentId === nodeId);
};

/**
 * Create a new node with default values
 * @param parentId - ID of the parent node
 * @returns New node object with default properties
 */
export const createDefaultNode = (parentId: string): Node => ({
  id: nanoid(),
  parentId,
  content: "test",
  priority: 100,
  metadata: { type: "text" },
  state: { isExpanded: true, isCompleted: false },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
