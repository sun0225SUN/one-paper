export interface Node {
  id: string
  content: string | null
  parentId: string
  priority: number
  metadata: {
    type: "text" | "todo"
  }
  state: {
    isCompleted?: boolean
    isExpanded?: boolean
  }
  createdAt: number
  updatedAt: number
}

export type DropTarget = {
  type: "between" | "inside"
  nodeId: string
  index?: number
}
