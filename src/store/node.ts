import { nanoid } from "nanoid"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type Node } from "~/types/node"

interface NodeStore {
  nodes: Node[]
  addNode: (node: Node) => void
  deleteNode: (nodeId: string) => void
  updateNode: (nodeId: string, node: Node) => void
}

export const useNodeStore = create<NodeStore>()(
  persist(
    (set, get) => ({
      nodes: [
        {
          id: nanoid(),
          //  make a million 💰
          priority: 1000000,
          content: "Hello world!",
          parentId: "root",
          metadata: { type: "text" },
          state: {
            isCompleted: false,
            isExpanded: true,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      addNode: (node: Node) => set({ nodes: [...get().nodes, node] }),
      deleteNode: (nodeId: string) =>
        set({ nodes: get().nodes.filter((n) => n.id !== nodeId) }),
      updateNode: (nodeId: string, node: Node) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId ? { ...n, ...node } : n,
          ),
        }),
    }),
    {
      name: "nodes-storage",
    },
  ),
)
