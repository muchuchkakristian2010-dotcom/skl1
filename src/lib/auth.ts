// Якщо в .env задано ADMIN_CODE — для змін потрібен цей код. Інакше доступ відкритий.
export function isAuthorized(req: Request): boolean {
  const required = process.env.ADMIN_CODE;
  if (!required) return true;
  return req.headers.get("x-admin-code") === required;
}

export type TaskInput = {
  subject: string;
  number: string;
  title: string;
  body: string;
  image: string | null;
  answer: string;
  solution: string;
  answerImage: string | null;
};

export function parseTask(data: unknown): TaskInput | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const img = (v: unknown) =>
    typeof v === "string" && v.startsWith("data:image/") ? v : null;
  const out: TaskInput = {
    subject: str(d.subject) || "Загальне",
    number: str(d.number),
    title: str(d.title),
    body: str(d.body),
    image: img(d.image),
    answer: str(d.answer),
    solution: str(d.solution),
    answerImage: img(d.answerImage),
  };
  if (!out.number) return null;
  if (!out.body && !out.image) return null;
  return out;
}
