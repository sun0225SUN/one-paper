import clsx from "clsx"
import Triangle from "~/assets/images/svg/triangle.svg"
import { type DropTarget, type Node } from "~/types/node"
import { getChildNodes, setCursorToEnd } from "~/utils/node-operations"

interface NodeProps {
  node: Node
  hasChildren: boolean
  isPartOfDraggedNode: (id: string) => boolean
  dropTarget: DropTarget | null
  toggleNodeExpansion: (id: string) => void
  handleNodeContentChange: (
    id: string,
    e: React.FormEvent<HTMLSpanElement>,
  ) => void
  handleKeyDown: (e: React.KeyboardEvent, id: string) => void
  setDragHandle: (handle: HTMLSpanElement | null) => void
  renderNodes: (parentId: string) => React.ReactNode
  nodes: Node[]
}

export function Node({
  node,
  hasChildren,
  isPartOfDraggedNode,
  dropTarget,
  toggleNodeExpansion,
  handleNodeContentChange,
  handleKeyDown,
  setDragHandle,
  renderNodes,
  nodes,
}: NodeProps) {
  return (
    <div
      className={clsx(
        "node-wrapper group relative rounded-sm pl-1 outline-blue-500",

        // Dragged node state
        {
          "cursor-grabbing select-none !bg-[rgba(243,244,246,0.8)] !text-[rgba(0,0,0,0.5)] dark:!bg-[rgba(26,26,26,0.8)] dark:!text-[rgba(255,255,255,0.5)]":
            isPartOfDraggedNode(node.id),
        },

        // Drop target states
        dropTarget?.nodeId === node.id && {
          // Inside drop target
          "relative z-10 bg-blue-50 outline outline-2 outline-blue-500 dark:bg-blue-900/20":
            dropTarget.type === "inside",

          // Between drop target
          "before:pointer-events-none before:absolute before:-top-[1px] before:left-0 before:z-20 before:h-[2px] before:w-full before:bg-blue-500 after:pointer-events-none after:absolute after:-left-[3px] after:-top-[3px] after:z-20 after:size-[6px] after:rounded-full after:bg-blue-500":
            dropTarget.type === "between" &&
            dropTarget.index ===
              getChildNodes(nodes, node.parentId ?? "root").findIndex(
                (n) => n.id === node.id,
              ),
          "before:pointer-events-none before:absolute before:-bottom-[1px] before:left-0 before:z-20 before:h-[2px] before:w-full before:bg-blue-500 after:pointer-events-none after:absolute after:-bottom-[3px] after:-left-[3px] after:z-20 after:size-[6px] after:rounded-full after:bg-blue-500":
            dropTarget.type === "between" &&
            dropTarget.index ===
              getChildNodes(nodes, node.parentId ?? "root").findIndex(
                (n) => n.id === node.id,
              ) +
                1,
        },
      )}
    >
      {/* current node */}
      <div
        onClick={() => {
          const element = document.getElementById(node.id)
          if (element && document.activeElement !== element) {
            setCursorToEnd(node.id)
          }
        }}
        className={clsx(
          "group/outer",
          "relative flex cursor-text items-center py-1",
          "before:absolute before:-left-6 before:top-0 before:h-full before:w-6 before:cursor-pointer before:content-['']",
        )}
      >
        {/*  expand triangle */}
        {hasChildren && (
          <button
            onClick={() => toggleNodeExpansion(node.id)}
            className={clsx(
              "absolute -left-6 origin-center",
              "hidden group-hover/outer:block",
              "transition-transform duration-200 ease-in-out",
              node.state.isExpanded ? "rotate-0" : "-rotate-90",
            )}
          >
            <Triangle className="size-5 text-black dark:text-white" />
          </button>
        )}

        {/* drag circle */}
        <span
          ref={setDragHandle}
          id={`drag-handle-${node.id}`}
          className="group/inner relative size-5 cursor-grab"
        >
          <span
            className={clsx(
              "absolute inset-0",
              "size-5 rounded-full bg-gray-300 dark:bg-gray-700",
              "opacity-0 transition-all duration-200 ease-in-out",
              !node.state.isExpanded
                ? "opacity-100"
                : "group-hover/inner:opacity-100",
            )}
          />
          <span className="absolute left-[6px] top-[6px] size-2 rounded-full bg-black dark:bg-white" />
        </span>

        {/* node content */}
        <span
          id={`content-${node.id}`}
          ref={(el) => {
            if (el) el.textContent = node.content ?? ""
          }}
          contentEditable
          suppressContentEditableWarning
          className="w-full cursor-text pl-1 outline-none"
          onInput={(e) => handleNodeContentChange(node.id, e)}
          onKeyDown={(e) => handleKeyDown(e, node.id)}
        />
      </div>

      {/* child nodes */}
      {node.state.isExpanded !== false && (
        <div className="ml-[9px] border-l-2 border-gray-300 pl-6">
          {renderNodes(node.id)}
        </div>
      )}
    </div>
  )
}
