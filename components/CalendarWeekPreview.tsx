"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
};

type PendingEvent = {
    title: string;
    datetime: string;
};

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 48;

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

    const pendingStart = new Date(pendingEvent.datetime);
    const pendingEnd = new Date(pendingStart.getTime() + 30 * 60000);

    const allItems = [
        ...events.map((e) => ({
            title: e.summary,
            start: new Date(e.start?.dateTime ?? e.start?.date ?? ""),
            end: new Date(e.end?.dateTime ?? e.end?.date ?? ""),
            isNew: false,
        })),
        {
            title: pendingEvent.title,
            start: pendingStart,
            end: pendingEnd,
            isNew: true,
        },
    ];

    const hours: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
        hours.push(h);
    }

    function getTopOffset(date: Date) {
        const hourFraction = date.getHours() + date.getMinutes() / 60;
        return (hourFraction - START_HOUR) * HOUR_HEIGHT;
    }

    function getHeight(start: Date, end: Date) {
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return Math.max(durationHours * HOUR_HEIGHT, 20);
    }

    return (
        <div className="border rounded mt-2 bg-white overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 p-2 border-b">This week</p>

            <div className="flex">
                <div className="w-12 shrink-0">
                    <div className="h-8 border-b" />
                    {hours.map((h) => (
                        <div
                            key={h}
                            className="text-xs text-gray-400 text-right pr-1 border-b"
                            style={{ height: HOUR_HEIGHT }}
                        >
                            {h}:00
                        </div>
                    ))}
                </div>

                <div className="flex-1 grid grid-cols-7 overflow-x-auto">
                    {dayColumns.map((col) => {
                        const dayItems = allItems.filter(
                            (item) => item.start.toDateString() === col.date.toDateString()
                        );

                        return (
                            <div key={col.label} className="border-l relative">
                                <div className="h-8 border-b text-center text-xs py-1">
                                    <p className="font-semibold text-gray-600">{col.label}</p>
                                    <p className="text-gray-400">{col.date.getDate()}</p>
                                </div>

                                <div
                                    className="relative"
                                    style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
                                >
                                    {hours.map((h) => (
                                        <div
                                            key={h}
                                            className="border-b"
                                            style={{ height: HOUR_HEIGHT }}
                                        />
                                    ))}

                                    {dayItems.map((item, i) => (
                                        <div
                                            key={i}
                                            className={`absolute left-0.5 right-0.5 rounded px-1 text-[10px] overflow-hidden ${
                                                item.isNew
                                                    ? "bg-blue-100 border border-blue-500 text-blue-900 font-semibold z-20"
                                                    : "bg-gray-100 border border-gray-100 text-gray-700 z-10"
                                            }`}
                                            style={{
                                                top: getTopOffset(item.start),
                                                height: getHeight(item.start, item.end),
                                            }}
                                        >
                                            {item.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}