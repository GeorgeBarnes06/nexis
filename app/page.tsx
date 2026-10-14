import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { APP_URL } from "@/lib/config";
import type { CalendarEvent, Task } from "@/types/google";

async function getEvents() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(`${APP_URL}/api/calendar/events`, {
        cache: "no-store",
        headers: {
            Cookie: cookieHeader,
        }
    });

    if (!res.ok) {
        return [];
    } else {
        const data = await res.json();
        return data;
    }
}

async function getTasks() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(`${APP_URL}/api/tasks`, {
        cache: "no-store",
        headers: {
            Cookie: cookieHeader,
        }
    });

    if (!res.ok) {
        return [];
    } else {
        const data = await res.json();
        return data;
    }
}

function isToday(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return (
            <main className="flex items-center justify-center h-screen">
                <Link href="/api/auth/signin" className="text-black px-4 py-2 rounded">
                    Sign in with Google
                </Link>
            </main>
        );
    }

    const allEvents = await getEvents();
    const allTasks = await getTasks();

    const todayEvents = allEvents.filter((event: CalendarEvent) => {
        const dateStr = event.start?.dateTime ?? event.start?.date;
        return dateStr && isToday(dateStr);
    });

    const openTasks = allTasks
        .filter((task: Task) => task.status === "needsAction")
        .slice(0, 5);

    return (
        <main className="p-6">
            <p className="text-lg mb-6">Hello {session.user?.name}</p>

            <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-4">
                    <p className="font-bold mb-2">Today</p>
                    {todayEvents.length === 0 ? (
                        <p className="text-xs text-gray-500">Nothing scheduled today</p>
                    ) : (
                        <ul className="space-y-2">
                            {todayEvents.map((event: CalendarEvent) => (
                                <li key={event.id} className="border-b pb-2">
                                    <p className="font-semibold text-sm">{event.summary}</p>
                                    <p className="text-xs text-gray-500">
                                        {event.start?.dateTime
                                            ? new Date(event.start.dateTime).toLocaleString("en-GB", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "All day"}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="border rounded p-4">
                    <p className="font-bold mb-2">Tasks</p>
                    {openTasks.length === 0 ? (
                        <p className="text-xs text-gray-500">No open tasks</p>
                    ) : (
                        <ul className="space-y-2">
                            {openTasks.map((task: Task) => (
                                <li key={task.id} className="border-b pb-2">
                                    <p className="font-semibold text-sm">{task.title}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </main>
    );
}