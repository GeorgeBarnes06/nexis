"use client";

import { useState } from "react";
import CalendarWeekPreview from "@/components/CalendarWeekPreview";

type Message = {
    role: "user" | "assistant";
    text: string;
    action?: any;
    confirmed?: boolean;
    success?: boolean;
};

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        const res = await fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: userMessage.text }),
        });

        const data = await res.json();

        setMessages((prev) => [...prev, { role: "assistant", text: data.reply, action: data.action }]);
        setLoading(false);
    }

    async function handleConfirm(action: any, index: number) {
        setConfirmingIndex(index);

        const res = await fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmedAction: action }),
        });

        const data = await res.json();

        setMessages((prev) =>
            prev.map((msg, i) => (i === index ? { ...msg, confirmed: true } : msg))
        );
        setMessages((prev) => [
            ...prev,
            { role: "assistant", text: data.reply, success: data.ok },
        ]);
        setConfirmingIndex(null);
    }

    function handleCancel(index: number) {
        setMessages((prev) =>
            prev.map((msg, i) => (i === index ? { ...msg, confirmed: true } : msg))
        );
        setMessages((prev) => [...prev, { role: "assistant", text: "Okay, cancelled." }]);
    }

    function actionLabel(type: string) {
        if (type === "add_event") return "New event";
        if (type === "add_task") return "New task";
        if (type === "complete_task") return "Mark as done";
        return "Action";
    }

    return (
        <main className="p-6 flex flex-col h-screen">
            <h1 className="text-2xl font-bold mb-4">Assistant</h1>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((msg, i) => (
                    <div key={i}>
                        <div
                            className={`max-w-md px-4 py-2 rounded ${
                                msg.role === "user"
                                    ? "bg-gray-900 text-white ml-auto"
                                    : msg.success === true
                                    ? "bg-green-100 text-green-900 border border-green-400"
                                    : msg.success === false
                                    ? "bg-red-100 text-red-900 border border-red-400"
                                    : "bg-gray-200 text-gray-900"
                            }`}
                        >
                            {msg.success === true && "✓ "}
                            {msg.text}
                        </div>

                        {msg.action && !msg.confirmed && (
                            <div className="max-w-2xl border rounded p-3 mt-2 bg-white">
                                <p className="text-sm font-semibold">
                                    {actionLabel(msg.action.type)}
                                </p>
                                <p className="text-sm">{msg.action.title}</p>
                                {msg.action.datetime && (
                                    <p className="text-xs text-gray-500">
                                        {new Date(msg.action.datetime).toLocaleString("en-GB")}
                                    </p>
                                )}

                                {msg.action.type === "add_event" && (
                                    <CalendarWeekPreview
                                        pendingEvent={{ title: msg.action.title, datetime: msg.action.datetime }}
                                    />
                                )}

                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleConfirm(msg.action, i)}
                                        disabled={confirmingIndex === i}
                                        className="text-xs bg-gray-900 text-white px-3 py-1 rounded disabled:opacity-50"
                                    >
                                        {confirmingIndex === i ? "Adding..." : "Confirm"}
                                    </button>
                                    <button
                                        onClick={() => handleCancel(i)}
                                        disabled={confirmingIndex === i}
                                        className="text-xs bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="max-w-md px-4 py-2 rounded bg-gray-200 text-gray-900">
                        Thinking...
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. remind me to call the dentist tomorrow at 3pm"
                    className="flex-1 border px-3 py-2 rounded"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-gray-900 text-white px-4 py-2 rounded"
                >
                    Send
                </button>
            </form>
        </main>
    );
}