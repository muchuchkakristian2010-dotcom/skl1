import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import AnswerReveal from "@/components/AnswerReveal";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!t) notFound();

  return (
    <div className="space-y-4">
      <Link href="/" className="inline-block text-sm text-indigo-600">
        ← Усі завдання
      </Link>

      <article className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">{t.subject}</p>
        <h1 className="text-xl font-bold">
          Завдання №{t.number}
          {t.title ? ` — ${t.title}` : ""}
        </h1>
        {t.body && (
          <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
            {t.body}
          </p>
        )}
        {t.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.image} alt={`Завдання ${t.number}`} className="w-full rounded-xl border" />
        )}
      </article>

      <AnswerReveal answer={t.answer} solution={t.solution} image={t.answerImage} />

      <div className="flex gap-3 pt-2">
        <Link
          href={`/task/${t.id}/edit`}
          className="flex-1 rounded-xl border bg-white py-3 text-center text-sm font-medium"
        >
          Редагувати
        </Link>
        <DeleteButton id={t.id} />
      </div>
    </div>
  );
}
