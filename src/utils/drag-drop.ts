import type { Node } from "~/types/node"
import { getChildNodes } from "./node-operations"

export function isDescendant(
  nodes: Node[],
  sourceId: string,
  targetId: string,
): boolean {
  const isChild = (parentId: string): boolean => {
    if (targetId === parentId) return true
    const children = getChildNodes(nodes, parentId)
    return children.some((child) => isChild(child.id))
  }
  return isChild(sourceId)
}

export function calculateDropPosition(
  rect: DOMRect,
  mouseY: number,
  GAP_THRESHOLD: number,
) {
  const relativeY = mouseY - rect.top
  const nodeHeight = rect.height

  if (relativeY <= GAP_THRESHOLD) {
    return "top"
  } else if (relativeY >= nodeHeight - GAP_THRESHOLD) {
    return "bottom"
  } else {
    return "inside"
  }
}
