import Link from "next/link";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import TaskForm from "@/components/TaskForm";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  const subjects = (await db.selectDistinct({ s: tasks.subject }).from(tasks)).map((r) => r.s);
  return (
    <div className="space-y-4">
      <Link href="/" className="inline-block text-sm text-indigo-600">
        ← Усі завдання
      </Link>
      <h1 className="text-xl font-bold">Нове завдання</h1>
      <TaskForm subjects={subjects} />
    </div>
  );
}
