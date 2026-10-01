import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { isAuthorized, parseTask } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Невірний код доступу" }, { status: 401 });
  }
  const id = Number((await ctx.params).id);
  const input = parseTask(await req.json().catch(() => null));
  if (!Number.isInteger(id) || !input) {
    return NextResponse.json(
      { error: "Вкажіть номер та умову (текст або фото)" },
      { status: 400 },
    );
  }
  await db.update(tasks).set(input).where(eq(tasks.id, id));
  return NextResponse.json({ id });
}

export async function DELETE(req: Request, ctx: Ctx) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Невірний код доступу" }, { status: 401 });
  }
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Некоректний id" }, { status: 400 });
  }
  await db.delete(tasks).where(eq(tasks.id, id));
  return NextResponse.json({ ok: true });
}
