// todo-list.tsx
"use client";

import { useMutation, usePreloadedQuery, Preloaded } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TodoListProps {
  preloadedTodos: Preloaded<typeof api.tasks.get>;
}

export function TodoList({ preloadedTodos }: TodoListProps) {
  const todos = usePreloadedQuery(preloadedTodos);
  const checkTodo = useMutation(api.tasks.check);
  const removeTodo = useMutation(api.tasks.remove);
  const updateTodoText = useMutation(api.tasks.updateText);

  const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);

  const handleToggleTodo = async (id: Id<"tasks">, completed: boolean) => {
    await checkTodo({ id, completed: !completed });
  };

  const handleDeleteTodo = async (id: Id<"tasks">) => {
    await removeTodo({ id });
  };

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li
          key={todo._id}
          className="flex items-center justify-between rounded-md border p-2"
        >
          <div className="flex flex-1 items-center space-x-2">
            <Checkbox
              checked={todo.completed ?? false}
              onCheckedChange={() =>
                handleToggleTodo(todo._id, todo.completed ?? false)
              }
              id={`todo-${todo._id}`}
            />
            {editingId === todo._id ? (
              <Input
                autoFocus
                defaultValue={todo.text}
                className="h-8"
                onBlur={(e) => {
                  updateTodoText({
                    id: todo._id,
                    text: e.target.value,
                  });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateTodoText({
                      id: todo._id,
                      text: e.currentTarget.value,
                    });
                    setEditingId(null);
                  }
                  if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
              />
            ) : (
              <label
                htmlFor={`todo-${todo._id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setEditingId(todo._id);
                }}
                className={`flex-1 cursor-pointer ${
                  (todo.completed ?? false)
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {todo.text}
              </label>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteTodo(todo._id)}
            aria-label="Delete todo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
