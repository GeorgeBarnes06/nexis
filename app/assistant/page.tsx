"use client";

import { useState } from "react";
import CalendarWeekPreview from "@/components/CalendarWeekPreview";

type Message = {
    role: "user" | "assistant";
    text: string;
    action?: any;
};

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

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

    async function handleConfirm(action: any) {
        setLoading(true);

        const res = await fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmedAction: action }),
        });

        const data = await res.json();

        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
        setLoading(false);
    }

    function handleCancel() {
        setMessages((prev) => [...prev, { role: "assistant", text: "Okay, cancelled." }]);
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
                                    : "bg-gray-200 text-gray-900"
                            }`}
                        >
                            {msg.text}
                        </div>

                        {msg.action && (
                            <div className="max-w-2xl border rounded p-3 mt-2 bg-white">
                                <p className="text-sm font-semibold">
                                    {msg.action.type === "add_event" ? "New event" : "New task"}
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
                                        onClick={() => handleConfirm(msg.action)}
                                        className="text-xs bg-gray-900 text-white px-3 py-1 rounded"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="text-xs bg-gray-200 px-3 py-1 rounded"
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