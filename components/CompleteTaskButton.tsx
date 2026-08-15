"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteTaskButton({ taskId, taskListId }: { taskId: string; taskListId: string }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    async function handleComplete() {
        setSubmitting(true);

        await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskListId: taskListId,
            }),
        });

        setSubmitting(false);
        router.refresh();
    }

    return (
        <button
            onClick={handleComplete}
            disabled={submitting}
            className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
            {submitting ? "..." : "Done"}
        </button>
    );
}