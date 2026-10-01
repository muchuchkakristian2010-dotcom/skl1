"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        if (!confirm("Видалити це завдання?")) return;
        const res = await fetch(`/api/tasks/${id}`, {
          method: "DELETE",
          headers: { "x-admin-code": localStorage.getItem("adminCode") ?? "" },
        });
        if (!res.ok) {
          alert("Не вдалося видалити (перевірте код доступу в формі редагування)");
          return;
        }
        router.push("/");
        router.refresh();
      }}
      className="flex-1 rounded-xl border border-red-200 bg-white py-3 text-center text-sm font-medium text-red-600 active:bg-red-50"
    >
      Видалити
    </button>
  );
}
