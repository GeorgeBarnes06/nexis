"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEventForm() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

        await fetch("/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                summary: title,
                start: { dateTime: startDateTime.toISOString() },
                end: { dateTime: endDateTime.toISOString() },
            }),
        });

        setTitle("");
        setDate("");
        setTime("");
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
            <div>
                <label className="block text-xs text-gray-500">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="border px-2 py-1 rounded"
                />
            </div>
            <div>
                <label className="block text-xs text-gray-500">Time</label>
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="border px-2 py-1 rounded"
                />
            </div>
            <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white px-4 py-1 rounded"
            >
                {submitting ? "Adding..." : "Add Event"}
            </button>
        </form>
    );
}