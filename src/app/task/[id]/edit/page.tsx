import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import TaskForm from "@/components/TaskForm";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!t) notFound();
  const subjects = (await db.selectDistinct({ s: tasks.subject }).from(tasks)).map((r) => r.s);

  return (
    <div className="space-y-4">
      <Link href={`/task/${id}`} className="inline-block text-sm text-indigo-600">
        ← Назад
      </Link>
      <h1 className="text-xl font-bold">Редагування завдання</h1>
      <TaskForm
        subjects={subjects}
        initial={{
          id: t.id,
          subject: t.subject,
          number: t.number,
          title: t.title,
          body: t.body,
          image: t.image,
          answer: t.answer,
          solution: t.solution,
          answerImage: t.answerImage,
        }}
      />
    </div>
  );
}
