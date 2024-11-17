"use client";

import { useState, Fragment } from "react";

interface Node {
  id: string;
  content: string | null;
  metadata: {
    type: "text" | "todo";
  };
  priority: number;
  parentId: string;
  createdAt: number;
  updatedAt: number;
}

export default function Note() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "111",
      priority: 100,
      content: "111 Hello, world!",
      parentId: "root",
      metadata: { type: "text" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "222",
      priority: 101,
      content: "222 Hello, world!",
      parentId: "111",
      metadata: { type: "text" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "555",
      priority: 102,
      content: "555 Hello, world!",
      parentId: "222",
      metadata: { type: "text" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "333",
      priority: 99,
      content: "333 Hello, world!",
      parentId: "222",
      metadata: { type: "text" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "444",
      priority: 50,
      content: "444 Hello, world!",
      parentId: "root",
      metadata: { type: "text" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);

  // Get child nodes filtered by parentId and sort them by priority in ascending order
  const getChildNodes = (parentId: string) => {
    return nodes
      .filter((node) => node.parentId === parentId)
      .sort((a, b) => a.priority - b.priority);
  };

  // Render the node tree structure recursively
  const renderNodes = (parentId: string) => {
    return getChildNodes(parentId).map((node) => (
      <Fragment key={node.id}>
        {/* current node */}
        <div className="my-2 flex items-center gap-2">
          <span className="size-2 rounded-full bg-black" />
          <span>{node.content ?? ""}</span>
        </div>
        {/* child nodes */}
        <div className="ml-[3px] border-l-2 border-gray-300 pl-6">
          {renderNodes(node.id)}
        </div>
      </Fragment>
    ));
  };

  return (
    <div className="mx-auto h-full w-full max-w-5xl p-10">
      {renderNodes("root")}
    </div>
  );
}
