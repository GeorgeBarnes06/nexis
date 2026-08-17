import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as chrono from "chrono-node";

function findBestTaskMatch(spokenTitle: string, tasks: any[]) {
    const spokenWords = spokenTitle.toLowerCase().split(/\s+/).filter(Boolean);

    let bestMatch = null;
    let bestScore = 0;

    for (const task of tasks) {
        if (task.status !== "needsAction") continue;

        const taskWords = task.title.toLowerCase().split(/\s+/).filter(Boolean);
        const overlap = spokenWords.filter((w: string) => taskWords.includes(w)).length;
        const score = overlap / Math.max(spokenWords.length, taskWords.length);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = task;
        }
    }

    return bestScore >= 0.3 ? bestMatch : null;
}

function findBestEventMatch(spokenTitle: string, events: any[]) {
    const spokenWords = spokenTitle.toLowerCase().split(/\s+/).filter(Boolean);

    let bestMatch = null;
    let bestScore = 0;

    for (const event of events) {
        if (!event.summary) continue;

        const eventWords = event.summary.toLowerCase().split(/\s+/).filter(Boolean);
        const overlap = spokenWords.filter((w: string) => eventWords.includes(w)).length;
        const score = overlap / Math.max(spokenWords.length, eventWords.length);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = event;
        }
    }

    return bestScore >= 0.3 ? bestMatch : null;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {

        const body = await req.json();
        const cookie = req.headers.get("cookie") ?? "";

        if (body.confirmedAction) {
            return executeAction(body.confirmedAction, cookie);
        }

        const text = body.text;

        const parseRes = await fetch("http://localhost:8000/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        const parsed = await parseRes.json();
        const { intent, title, date_text } = parsed;

        if (intent === "add_event" || intent === "add_task") {
            const parsedDate = date_text ? chrono.parseDate(date_text, new Date(), { forwardDate: true }) : null;

            if (intent === "add_event" && !parsedDate) {
                return NextResponse.json({
                    reply: "I couldn't figure out when that's for. Try again with a clearer time.",
                    action: null,
                });
            }

            return NextResponse.json({
                reply: `Here's what I'll add — check it looks right:`,
                action: {
                    type: intent,
                    title: title ?? "Untitled",
                    datetime: parsedDate ? parsedDate.toISOString() : null,
                },
            });

        } else if (intent === "update_event") {
            if (!title) {
                return NextResponse.json({
                    reply: "Which event did you want to move?",
                    action: null,
                });
            }

            const parsedDate = date_text ? chrono.parseDate(date_text, new Date(), { forwardDate: true }) : null;

            if (!parsedDate) {
                return NextResponse.json({
                    reply: "I couldn't figure out the new time. Try again with a clearer time.",
                    action: null,
                });
            }

            const eventsRes = await fetch("http://localhost:3000/api/calendar/events?days=60", {
                headers: { Cookie: cookie },
                cache: "no-store",
            });

            const events = await eventsRes.json();
            const match = findBestEventMatch(title, events);

            if (!match) {
                return NextResponse.json({
                    reply: `I couldn't find an event matching "${title}".`,
                    action: null,
                });
            }

            const oldStart = match.start?.dateTime ?? match.start?.date;
            const oldEnd = match.end?.dateTime ?? match.end?.date;
            const durationMs = new Date(oldEnd).getTime() - new Date(oldStart).getTime();
            const newEnd = new Date(parsedDate.getTime() + durationMs);

            return NextResponse.json({
                reply: `Here's the change — check it looks right:`,
                action: {
                    type: "update_event",
                    title: match.summary,
                    eventId: match.id,
                    oldDatetime: oldStart,
                    newDatetime: parsedDate.toISOString(),
                    newEndDatetime: newEnd.toISOString(),
                },
            });

        } else if (intent === "complete_task") {
            if (!title) {
                return NextResponse.json({
                    reply: "Which task did you want to mark as done?",
                    action: null,
                });
            }

            const tasksRes = await fetch("http://localhost:3000/api/tasks", {
                headers: { Cookie: cookie },
                cache: "no-store",
            });

            const tasks = await tasksRes.json();
            const match = findBestTaskMatch(title, tasks);

            if (!match) {
                return NextResponse.json({
                    reply: `I couldn't find an open task matching "${title}".`,
                    action: null,
                });
            }

            return NextResponse.json({
                reply: `Here's what I'll mark as done — check it looks right:`,
                action: {
                    type: "complete_task",
                    title: match.title,
                    taskId: match.id,
                    taskListId: match.taskListId,
                },
            });

        } else if (intent === "list_today") {
            const [eventsRes, tasksRes] = await Promise.all([
                fetch("http://localhost:3000/api/calendar/events", {
                    headers: { Cookie: cookie },
                    cache: "no-store",
                }),
                fetch("http://localhost:3000/api/tasks", {
                    headers: { Cookie: cookie },
                    cache: "no-store",
                }),
            ]);

            const allEvents = await eventsRes.json();
            const allTasks = await tasksRes.json();

            const now = new Date();
            const todayEvents = allEvents.filter((e: any) => {
                const dateStr = e.start?.dateTime ?? e.start?.date;
                return dateStr && new Date(dateStr).toDateString() === now.toDateString();
            });

            const openTasks = allTasks.filter((t: any) => t.status === "needsAction");

            if (todayEvents.length === 0 && openTasks.length === 0) {
                return NextResponse.json({
                    reply: "Nothing scheduled today, and no open tasks.",
                    action: null,
                });
            }

            return NextResponse.json({
                reply: "Here's today:",
                action: null,
                summary: {
                    events: todayEvents.map((e: any) => ({
                        title: e.summary,
                        time: e.start?.dateTime ?? null,
                    })),
                    tasks: openTasks.map((t: any) => ({ title: t.title })),
                },
            });

        } else {
            return NextResponse.json({
                reply: "I'm not sure what you meant. Try something like 'remind me to call the dentist tomorrow at 3pm'.",
                action: null,
            });
        }
    }
}

async function executeAction(action: any, cookie: string) {
    if (action.type === "add_event") {
        const startDate = new Date(action.datetime);
        const endDate = new Date(startDate.getTime() + 30 * 60000);

        const createRes = await fetch("http://localhost:3000/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                summary: action.title,
                start: { dateTime: startDate.toISOString() },
                end: { dateTime: endDate.toISOString() },
            }),
        });

        if (!createRes.ok) {
            const errorBody = await createRes.text();
            console.error("calendar create failed:", createRes.status, errorBody);
            return NextResponse.json({ reply: "Something went wrong creating that event.", ok: false });
        }

        return NextResponse.json({
            reply: `Added "${action.title}" to your calendar.`,
            ok: true,
        });

    } else if (action.type === "update_event") {
        const patchRes = await fetch(`http://localhost:3000/api/calendar/events/${action.eventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                start: { dateTime: action.newDatetime },
                end: { dateTime: action.newEndDatetime },
            }),
        });

        if (!patchRes.ok) {
            const errorBody = await patchRes.text();
            console.error("event update failed:", patchRes.status, errorBody);
            return NextResponse.json({ reply: "Something went wrong moving that event.", ok: false });
        }

        return NextResponse.json({
            reply: `Moved "${action.title}" to its new time.`,
            ok: true,
        });

    } else if (action.type === "add_task") {
        const createRes = await fetch("http://localhost:3000/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                title: action.title,
                due: action.datetime ?? undefined,
            }),
        });

        if (!createRes.ok) {
            const errorBody = await createRes.text();
            console.error("task create failed:", createRes.status, errorBody);
            return NextResponse.json({ reply: "Something went wrong adding that task.", ok: false });
        }

        return NextResponse.json({
            reply: `Added "${action.title}" to your tasks.`,
            ok: true,
        });

    } else if (action.type === "complete_task") {
        const patchRes = await fetch(`http://localhost:3000/api/tasks/${action.taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                taskListId: action.taskListId,
            }),
        });

        if (!patchRes.ok) {
            const errorBody = await patchRes.text();
            console.error("task complete failed:", patchRes.status, errorBody);
            return NextResponse.json({ reply: "Something went wrong marking that task done.", ok: false });
        }

        return NextResponse.json({
            reply: `Marked "${action.title}" as done.`,
            ok: true,
        });
    }

    return NextResponse.json({ reply: "Unknown action type.", ok: false });
}