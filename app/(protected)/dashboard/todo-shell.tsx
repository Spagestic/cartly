"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TodoInput } from "./todo-input";
import { Suspense } from "react";

export function TodoShell({ children }: { children: React.ReactNode }) {
  const addTodo = useMutation(api.tasks.add);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
        <CardDescription>Manage your tasks efficiently</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={<div className="h-10 mb-6 w-full bg-muted rounded" />}
        >
          <TodoInput
            onSubmit={async (text) => {
              await addTodo({ text });
            }}
          />
        </Suspense>
        {children}
      </CardContent>
    </Card>
  );
}
