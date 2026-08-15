import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CreateEventForm from "@/components/CreateEventForm";

async function getEvents() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch("http://localhost:3000/api/calendar/events", {
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

export default async function CalendarPage() {
    const session = await getServerSession(authOptions);
    const events = await getEvents();

    if (!session) {
        return (
            <main className="p-6">
                <p>Please sign in to view your calendar.</p>
            </main>
        );
    }

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Calendar</h1>

            <CreateEventForm />

            <ul className="space-y-2 mt-6">
                {events.map((event: any) => (
                    <li key={event.id} className="border-b pb-2">
                        <p className="font-semibold text-sm">{event.summary}</p>
                        <p className="text-xs text-gray-500">
                            {event.start?.dateTime
                                ? new Date(event.start.dateTime).toLocaleString("en-GB", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                                : event.start?.date}
                        </p>
                    </li>
                ))}
            </ul>
        </main>
    );
}