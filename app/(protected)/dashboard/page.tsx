// app/page.tsx
import { Suspense } from "react";
import { TodoList } from "./todo-list";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { TodoShell } from "./todo-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "todo app",
  description: "todo app",
};

export default function Page() {
  return (
    <div>
      <div className="flex min-h-screen flex-col items-center justify-between">
        <div className="mx-auto w-full max-w-md pt-10">
          <TodoShell>
            <Suspense fallback={<TodoListSkeleton />}>
              <TodoSection />
            </Suspense>
          </TodoShell>
        </div>
      </div>
    </div>
  );
}

export async function TodoSection() {
  // This makes the section dynamic (no-store) but only inside Suspense
  const preloadedTodos = await preloadQuery(api.tasks.get);

  return <TodoList preloadedTodos={preloadedTodos} />;
}

function TodoListSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 w-full rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
    </div>
  );
}
