"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  id?: number;
  subject: string;
  number: string;
  title: string;
  body: string;
  image: string | null;
  answer: string;
  solution: string;
  answerImage: string | null;
};

const empty: Initial = {
  subject: "",
  number: "",
  title: "",
  body: "",
  image: null,
  answer: "",
  solution: "",
  answerImage: null,
};

function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Не вдалося прочитати фото"));
    img.src = url;
  });
}

function ImagePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mb-2 max-h-64 w-full rounded-xl border object-contain bg-white" />
      )}
      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-400 bg-white px-4 py-3 text-center text-sm text-slate-600 active:bg-slate-50">
          {busy ? "Обробка…" : value ? "Замінити фото" : "📷 Додати скрін / фото"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                onChange(await compress(f));
              } catch {
                alert("Не вдалося обробити фото");
              }
              setBusy(false);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-xl border bg-white px-4 text-sm text-red-600"
          >
            Прибрати
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function TaskForm({
  initial = empty,
  subjects,
}: {
  initial?: Initial;
  subjects: string[];
}) {
  const router = useRouter();
  const [f, setF] = useState<Initial>(initial);
  const [code, setCode] = useState("");
  useEffect(() => {
    setCode(localStorage.getItem("adminCode") ?? "");
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof Initial>(k: K, v: Initial[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    localStorage.setItem("adminCode", code);
    const res = await fetch(initial.id ? `/api/tasks/${initial.id}` : "/api/tasks", {
      method: initial.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", "x-admin-code": code },
      body: JSON.stringify(f),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Помилка збереження");
      return;
    }
    router.push(`/task/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <label className="col-span-1 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">№ завдання *</span>
          <input className={inputCls} value={f.number} onChange={(e) => set("number", e.target.value)} placeholder="12" required />
        </label>
        <label className="col-span-2 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Предмет / розділ</span>
          <input className={inputCls} list="subjects" value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Математика" />
          <datalist id="subjects">
            {subjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Назва (необов’язково)</span>
        <input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Умова (текст)</span>
        <textarea className={inputCls} rows={5} value={f.body} onChange={(e) => set("body", e.target.value)} />
      </label>

      <ImagePicker label="Умова (скрін)" value={f.image} onChange={(v) => set("image", v)} />

      <hr className="border-slate-200" />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Відповідь</span>
        <input className={inputCls} value={f.answer} onChange={(e) => set("answer", e.target.value)} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Розв’язання (необов’язково)</span>
        <textarea className={inputCls} rows={5} value={f.solution} onChange={(e) => set("solution", e.target.value)} />
      </label>

      <ImagePicker label="Розв’язання / відповідь (скрін)" value={f.answerImage} onChange={(v) => set("answerImage", v)} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Код доступу (якщо встановлено)</span>
        <input className={inputCls} type="password" value={code} onChange={(e) => setCode(e.target.value)} />
      </label>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        disabled={saving}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white active:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? "Збереження…" : initial.id ? "Зберегти зміни" : "Додати завдання"}
      </button>
    </form>
  );
}
