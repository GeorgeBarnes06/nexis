"use client";

import { useState, useRef, useEffect } from "react";
import CalendarWeekPreview from "@/components/CalendarWeekPreview";

type Message = {
    role: "user" | "assistant";
    text: string;
    action?: any;
    confirmed?: boolean;
    success?: boolean;
    summary?: any;
};

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

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

        setMessages((prev) => [
            ...prev,
            { role: "assistant", text: data.reply, action: data.action, summary: data.summary },
        ]);
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
        if (type === "update_event") return "Move event";
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

                        {msg.summary && (
                            <div className="max-w-md border rounded p-3 mt-2 bg-white space-y-3">
                                {msg.summary.events.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Events</p>
                                        {msg.summary.events.map((e: any, idx: number) => (
                                            <p key={idx} className="text-sm">
                                                {e.time
                                                    ? new Date(e.time).toLocaleTimeString("en-GB", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "All day"}{" "}
                                                — {e.title}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                {msg.summary.tasks.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Open tasks</p>
                                        {msg.summary.tasks.map((t: any, idx: number) => (
                                            <p key={idx} className="text-sm">
                                                {t.title}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {msg.action && (
                            <div className="max-w-2xl border rounded p-3 mt-2 bg-white">
                                <p className="text-sm font-semibold">
                                    {actionLabel(msg.action.type)}
                                </p>
                                <p className="text-sm">{msg.action.title}</p>

                                {msg.action.type === "update_event" ? (
                                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                        <p>
                                            <span className="text-gray-400">From:</span>{" "}
                                            {new Date(msg.action.oldDatetime).toLocaleString("en-GB")}
                                        </p>
                                        <p>
                                            <span className="text-gray-400">To:</span>{" "}
                                            {new Date(msg.action.newDatetime).toLocaleString("en-GB")}
                                        </p>
                                    </div>
                                ) : (
                                    msg.action.datetime && (
                                        <p className="text-xs text-gray-500">
                                            {new Date(msg.action.datetime).toLocaleString("en-GB")}
                                        </p>
                                    )
                                )}

                                {msg.action.type === "add_event" && (
                                    <CalendarWeekPreview
                                        pendingEvent={{ title: msg.action.title, datetime: msg.action.datetime }}
                                        confirmed={msg.confirmed}
                                    />
                                )}

                                {msg.action.type === "update_event" && (
                                    <CalendarWeekPreview
                                        pendingEvent={{ title: msg.action.title, datetime: msg.action.newDatetime }}
                                        confirmed={msg.confirmed}
                                    />
                                )}

                                {!msg.confirmed && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleConfirm(msg.action, i)}
                                            disabled={confirmingIndex === i}
                                            className="text-xs bg-gray-900 text-white px-3 py-1 rounded disabled:opacity-50"
                                        >
                                            {confirmingIndex === i ? "Saving..." : "Confirm"}
                                        </button>
                                        <button
                                            onClick={() => handleCancel(i)}
                                            disabled={confirmingIndex === i}
                                            className="text-xs bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="max-w-md px-4 py-2 rounded bg-gray-200 text-gray-900">
                        Thinking...
                    </div>
                )}
                <div ref={bottomRef} />
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