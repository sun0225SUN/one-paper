export interface Node {
  id: string;
  parentId: string | null;
  depth: number;
  content: string;
  isFolded: boolean;
  isCompleted: boolean;
}
