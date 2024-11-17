import { ThemeToggle } from "./theme/toggle";

export default function Header() {
  return (
    <div className="flex h-16 items-center p-4">
      <ThemeToggle />
    </div>
  );
}
