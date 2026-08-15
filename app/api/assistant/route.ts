import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as chrono from "chrono-node";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {

        const body = await req.json();

        if (body.confirmedAction) {
            return executeAction(body.confirmedAction, req);
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
            const parsedDate = date_text ? chrono.parseDate(date_text) : null;

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

        } else if (intent === "list_today") {
            return NextResponse.json({
                reply: "Check the Home page for today's events and tasks.",
                action: null,
            });

        } else if (intent === "complete_task") {
            return NextResponse.json({
                reply: `I understood you want to mark "${title}" as done, but I don't have a way to look up which task that is yet — try the Tasks page for now.`,
                action: null,
            });

        } else {
            return NextResponse.json({
                reply: "I'm not sure what you meant. Try something like 'remind me to call the dentist tomorrow at 3pm'.",
                action: null,
            });
        }
    }
}

async function executeAction(action: any, req: Request) {
    const cookie = req.headers.get("cookie") ?? "";

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
            return NextResponse.json({ reply: "Something went wrong creating that event." });
        }

        return NextResponse.json({
            reply: `Added "${action.title}" to your calendar.`,
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
            return NextResponse.json({ reply: "Something went wrong adding that task." });
        }

        return NextResponse.json({
            reply: `Added "${action.title}" to your tasks.`,
        });
    }

    return NextResponse.json({ reply: "Unknown action type." });
}