"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
};

type PendingEvent = {
    title: string;
    datetime: string;
};

export default function CalendarWeekPreview({ pendingEvent }: { pendingEvent: PendingEvent }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/calendar/events")
            .then((res) => res.json())
            .then((data) => {
                setEvents(data);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <p className="text-xs text-gray-500 mt-2">Loading week...</p>;
    }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const dayColumns = days.map((label, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return { label, date };
    });

    const allItems = [
        ...events.map((e) => ({
            title: e.summary,
            datetime: e.start?.dateTime ?? e.start?.date ?? "",
            isNew: false,
        })),
        {
            title: pendingEvent.title,
            datetime: pendingEvent.datetime,
            isNew: true,
        },
    ];

    return (
        <div className="border rounded p-3 mt-2 bg-white">
            <p className="text-xs font-semibold text-gray-500 mb-2">This week</p>
            <div className="grid grid-cols-7 gap-1 text-xs">
                {dayColumns.map((col) => {
                    const dayItems = allItems.filter((item) => {
                        const itemDate = new Date(item.datetime);
                        return itemDate.toDateString() === col.date.toDateString();
                    });

                    return (
                        <div key={col.label} className="border rounded p-1 min-h-[80px]">
                            <p className="font-semibold text-gray-500">{col.label}</p>
                            <p className="text-gray-400 mb-1">{col.date.getDate()}</p>
                            {dayItems.map((item, i) => (
                                <div
                                    key={i}
                                    className={`rounded px-1 py-0.5 mb-1 truncate ${
                                        item.isNew
                                            ? "bg-blue-100 border border-blue-500 text-blue-900 font-semibold"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    {item.title}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}