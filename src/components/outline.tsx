"use client";

import { useState, useCallback, memo } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { type Node } from "~/types/node";

// 通用工具函数
const focusElement = (elementId: string) => {
  requestAnimationFrame(() => {
    const element = document.querySelector<HTMLElement>(
      `[data-node-id="${elementId}"]`,
    );
    if (element) {
      element.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  });
};

const getVisibleNodes = (data: Node[]) => {
  const visibleNodes: Node[] = [];
  const traverse = (nodes: Node[]) => {
    nodes.forEach((node) => {
      visibleNodes.push(node);
      if (!node.isFolded) {
        const children = data.filter((item) => item.parentId === node.id);
        traverse(children);
      }
    });
  };
  traverse(data.filter((item) => item.parentId === null));
  return visibleNodes;
};

// 子组件定义
const NodeActions = memo(function NodeActions({
  onAdd,
  onDelete,
  parentId,
}: {
  onAdd: () => void;
  onDelete: () => void;
  parentId: string | null;
}) {
  return (
    <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 gap-1 group-hover/item:flex">
      <button
        onClick={onAdd}
        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Plus size={16} />
      </button>
      {parentId !== null && (
        <button
          onClick={onDelete}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-500"
        >
          删除
        </button>
      )}
    </div>
  );
});

const FoldButton = memo(function FoldButton({
  isFolded,
  onClick,
}: {
  isFolded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mr-1 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    >
      {isFolded ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
    </button>
  );
});

const EditableContent = memo(function EditableContent({
  id,
  content,
  onBlur,
  onKeyDown,
}: {
  id: string;
  content: string;
  onBlur: (e: React.FocusEvent<HTMLSpanElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => void;
}) {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      data-node-id={id}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="inline-block min-w-[4px] outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
    >
      {content}
    </span>
  );
});

// 主组件
export function OutlineNotes() {
  const [data, setData] = useState<Node[]>([
    {
      id: "1",
      parentId: null,
      depth: 0,
      content: "根节点",
      isFolded: false,
      isCompleted: false,
    },
  ]);

  const generateId = useCallback(
    () => Math.random().toString(36).substr(2, 9),
    [],
  );

  // 节点操作函数
  const handleItemChange = useCallback((id: string, newContent: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, content: newContent } : item,
      ),
    );
  }, []);

  const addItem = useCallback(
    (parentId: string | null) => {
      const newId = generateId();
      const newItem: Node = {
        id: newId,
        parentId,
        depth: parentId ? 1 : 0,
        content: "",
        isFolded: false,
        isCompleted: false,
      };

      setData((prev) => [...prev, newItem]);
      focusElement(newId);
    },
    [generateId],
  );

  const deleteItem = useCallback((id: string) => {
    setData((prevData) => {
      const targetNode = prevData.find((item) => item.id === id);
      if (targetNode?.parentId === null) return prevData; // 保护根节点

      const getChildrenIds = (itemId: string): string[] => {
        const children = prevData.filter((item) => item.parentId === itemId);
        return [
          itemId,
          ...children.flatMap((child) => getChildrenIds(child.id)),
        ];
      };
      const idsToRemove = getChildrenIds(id);
      return prevData.filter((item) => !idsToRemove.includes(item.id));
    });
  }, []);

  const toggleFold = useCallback((id: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFolded: !item.isFolded } : item,
      ),
    );
  }, []);

  // 事件处理函数
  const handleSpanChange = useCallback(
    (id: string, e: React.FocusEvent<HTMLSpanElement>) => {
      const newContent = e.currentTarget.textContent ?? "";
      handleItemChange(id, newContent);
    },
    [handleItemChange],
  );

  const handleKeyDown = useCallback(
    (id: string, e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const currentItem = data.find((item) => item.id === id);
        if (currentItem?.parentId === null) {
          // 如果是根节点，添加子节点
          addItem(currentItem.id);
        } else {
          // 如果是其他节点，添加同级节点
          addItem(currentItem?.parentId ?? null);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const currentItem = data.find((item) => item.id === id);
        const isEmpty = !e.currentTarget.textContent?.trim();

        if (isEmpty && currentItem?.parentId !== null) {
          e.preventDefault();
          const visibleNodes = getVisibleNodes(data);
          const currentIndex = visibleNodes.findIndex((node) => node.id === id);
          const prevNode = visibleNodes[currentIndex - 1];

          deleteItem(id);
          if (prevNode) {
            focusElement(prevNode.id);
          }
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        const currentItem = data.find((item) => item.id === id);
        if (!currentItem) return;

        const newContent = e.currentTarget.textContent ?? "";
        handleItemChange(id, newContent);

        if (e.shiftKey) {
          const parentItem = data.find(
            (item) => item.id === currentItem.parentId,
          );
          setData((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    depth: Math.max(0, (item.depth || 0) - 1),
                    parentId: parentItem?.parentId ?? null,
                  }
                : item,
            ),
          );
        } else {
          const siblings = data.filter(
            (item) => item.parentId === currentItem.parentId,
          );
          const currentIndex = siblings.findIndex((item) => item.id === id);
          if (currentIndex > 0) {
            const newParentId = siblings[currentIndex - 1]!.id;
            setData((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      depth: (item.depth || 0) + 1,
                      parentId: newParentId,
                    }
                  : item,
              ),
            );
          }
        }
        focusElement(id);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const visibleNodes = getVisibleNodes(data);
        const currentIndex = visibleNodes.findIndex((node) => node.id === id);
        const targetIndex =
          e.key === "ArrowUp"
            ? Math.max(0, currentIndex - 1)
            : Math.min(visibleNodes.length - 1, currentIndex + 1);

        if (targetIndex !== currentIndex) {
          const targetNode = visibleNodes[targetIndex];
          if (targetNode) {
            focusElement(targetNode.id);
          }
        }
      }
    },
    [data, addItem, deleteItem, handleItemChange],
  );

  // 渲染函数
  const renderNode = useCallback(
    (item: Node, depth = 0) => {
      const hasDirectChildren = data.some(
        (child) => child.parentId === item.id,
      );

      return (
        <div key={item.id} style={{ marginLeft: depth === 0 ? 0 : "20px" }}>
          <div className="flex items-center rounded-md p-1 transition-colors hover:bg-gray-50">
            <div className="flex items-center">
              {hasDirectChildren ? (
                <FoldButton
                  isFolded={item.isFolded}
                  onClick={() => toggleFold(item.id)}
                />
              ) : (
                <div className="w-[28px]" />
              )}
              <div className="h-2 w-2 rounded-full bg-gray-400" />
            </div>

            <div className="group/item relative mx-2 flex-1">
              <EditableContent
                id={item.id}
                content={item.content}
                onBlur={(e) => handleSpanChange(item.id, e)}
                onKeyDown={(e) => handleKeyDown(item.id, e)}
              />
              <NodeActions
                onAdd={() => addItem(item.id)}
                onDelete={() => deleteItem(item.id)}
                parentId={item.parentId}
              />
            </div>
          </div>

          {!item.isFolded &&
            data
              .filter((child) => child.parentId === item.id)
              .map((child) => renderNode(child, depth + 1))}
        </div>
      );
    },
    [data, toggleFold, handleSpanChange, handleKeyDown, addItem, deleteItem],
  );

  return (
    <div className="outline-container mx-auto mt-10 max-w-5xl">
      {data.filter((item) => item.depth === 0).map((item) => renderNode(item))}
    </div>
  );
}
