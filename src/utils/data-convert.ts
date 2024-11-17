import { type Node } from "~/types/node"

/**
 * Transform a tree structure of nodes into a markdown string
 * @param nodes - Array of nodes containing parent-child relationships
 * @returns A markdown string with proper indentation for hierarchy
 */
export const transformToMarkdown = (nodes: Node[]): string => {
  // Find all root nodes (nodes with parentId equal to "root")
  const rootNodes = nodes.filter((node) => node.parentId === "root")

  // Return default root if no root nodes found
  if (rootNodes.length === 0) return "- Root"

  /**
   * Recursively build markdown string for a node and its children
   * @param node - Current node to process
   * @param level - Current indentation level
   * @returns Markdown string for current node and its subtree
   */
  function buildMarkdown(node: Node, level: number): string {
    // Create indentation based on level
    const indent = "  ".repeat(level)

    // Find all children of current node
    const children = nodes.filter((n) => n.parentId === node.id)

    // Start with current node
    let result = `${indent}- ${node.content}\n`

    // Recursively process all children
    children.forEach((child) => {
      result += buildMarkdown(child, level + 1)
    })

    return result
  }

  // Process all root nodes and join their results
  return rootNodes.map((node) => buildMarkdown(node, 0)).join("")
}
