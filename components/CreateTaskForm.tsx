"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTaskForm() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
            }),
        });

        setTitle("");
        setSubmitting(false);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div>
                <label className="block text-xs text-gray-500">Title</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="border px-2 py-1 rounded"
                />
            </div>
            <button
                type="submit"
                disabled={submitting}
                className="bg-gray-900 text-white px-4 py-1 rounded"
            >
                {submitting ? "Adding..." : "Add Task"}
            </button>
        </form>
    );
}