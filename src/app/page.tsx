import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string }>;
}) {
  const { q = "", subject = "" } = await searchParams;

  const rows = await db
    .select({
      id: tasks.id,
      subject: tasks.subject,
      number: tasks.number,
      title: tasks.title,
      body: tasks.body,
      hasImage: sql<boolean>`${tasks.image} is not null`,
      hasAnswer: sql<boolean>`(${tasks.answer} <> '' or ${tasks.solution} <> '' or ${tasks.answerImage} is not null)`,
    })
    .from(tasks);

  const subjects = Array.from(new Set(rows.map((r) => r.subject))).sort();
  const needle = q.trim().toLowerCase();

  const list = rows
    .filter((r) => (subject ? r.subject === subject : true))
    .filter((r) =>
      needle
        ? `${r.number} ${r.title} ${r.body}`.toLowerCase().includes(needle)
        : true,
    )
    .sort(
      (a, b) =>
        a.subject.localeCompare(b.subject, "uk") ||
        a.number.localeCompare(b.number, "uk", { numeric: true }),
    );

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
      active ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border"
    }`;
  const href = (s: string) =>
    `/?${new URLSearchParams({ ...(s ? { subject: s } : {}), ...(q ? { q } : {}) }).toString()}`;

  return (
    <div className="space-y-4">
      <form className="flex gap-2" action="/">
        {subject && <input type="hidden" name="subject" value={subject} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Пошук за номером або текстом…"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-indigo-500"
        />
        <button className="rounded-xl bg-indigo-600 px-4 text-white">🔍</button>
      </form>

      {subjects.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href={href("")} className={chip(!subject)}>
            Усі
          </Link>
          {subjects.map((s) => (
            <Link key={s} href={href(s)} className={chip(subject === s)}>
              {s}
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold">
            {rows.length === 0 ? "Завдань ще немає" : "Нічого не знайдено"}
          </p>
          {rows.length === 0 && (
            <>
              <p className="mt-1 text-sm text-slate-500">
                Додайте перше завдання з відповіддю.
              </p>
              <Link
                href="/add"
                className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
              >
                + Додати завдання
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <li key={t.id}>
              <Link
                href={`/task/${t.id}`}
                className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm active:bg-slate-50"
              >
                <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-indigo-100 px-2 text-lg font-bold text-indigo-700">
                  {t.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-slate-500">{t.subject}</span>
                  <span className="block truncate font-semibold">
                    {t.title || t.body.slice(0, 60) || "Завдання зі скріном"}
                  </span>
                  <span className="mt-1 flex gap-2 text-xs">
                    {t.hasImage && <span className="text-slate-500">🖼 фото</span>}
                    <span className={t.hasAnswer ? "text-emerald-600" : "text-amber-600"}>
                      {t.hasAnswer ? "✓ є відповідь" : "без відповіді"}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
