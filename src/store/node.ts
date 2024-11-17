import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Node } from "~/types/node";
import { nanoid } from "nanoid";

interface NodeStore {
  nodes: Node[];
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, node: Node) => void;
}

export const useNodeStore = create<NodeStore>()(
  persist(
    (set, get) => ({
      nodes: [
        {
          id: nanoid(),
          priority: 100,
          content: "Hello, world!",
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
      updateNode: (nodeId: string, node: Node) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId ? { ...n, ...node } : n,
          ),
        }),
    }),
    {
      name: "node-storage",
    },
  ),
);
