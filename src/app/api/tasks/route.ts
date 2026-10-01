import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { isAuthorized, parseTask } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Невірний код доступу" }, { status: 401 });
  }
  const input = parseTask(await req.json().catch(() => null));
  if (!input) {
    return NextResponse.json(
      { error: "Вкажіть номер та умову (текст або фото)" },
      { status: 400 },
    );
  }
  const [row] = await db.insert(tasks).values(input).returning({ id: tasks.id });
  return NextResponse.json({ id: row.id }, { status: 201 });
}
