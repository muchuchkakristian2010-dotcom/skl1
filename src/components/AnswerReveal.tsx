"use client";

import { useState } from "react";

export default function AnswerReveal({
  answer,
  solution,
  image,
}: {
  answer: string;
  solution: string;
  image: string | null;
}) {
  const [open, setOpen] = useState(false);
  const has = answer || solution || image;

  if (!has) {
    return (
      <p className="rounded-2xl bg-slate-200/60 p-4 text-center text-sm text-slate-500">
        Відповідь ще не додано
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl bg-emerald-600 py-3.5 text-base font-semibold text-white active:bg-emerald-700"
      >
        {open ? "Сховати відповідь" : "Показати відповідь"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          {answer && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Відповідь</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-lg font-semibold">{answer}</p>
            </div>
          )}
          {solution && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Розв’язання</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-base leading-relaxed">{solution}</p>
            </div>
          )}
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Розв’язання" className="w-full rounded-xl border bg-white" />
          )}
        </div>
      )}
    </div>
  );
}
