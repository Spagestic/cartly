// app/todo-input.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface TodoInputProps {
  onSubmit?: (text: string) => Promise<void>;
  isLoading?: boolean;
}

export function TodoInput({ onSubmit, isLoading = false }: TodoInputProps) {
  const [newTodoText, setNewTodoText] = useLocalStorage("todo-draft", "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit || !newTodoText.trim()) return;
    await onSubmit(newTodoText);
    setNewTodoText("");
  };

  const isButtonDisabled = isLoading || !onSubmit || !newTodoText.trim();

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex items-center space-x-2">
      <Input
        value={newTodoText}
        onChange={(e) => setNewTodoText(e.target.value)}
        placeholder="Add a new task..."
        disabled={isLoading}
      />
      <Button type="submit" disabled={isButtonDisabled}>
        Add
      </Button>
    </form>
  );
}
