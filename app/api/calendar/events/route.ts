import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {

        const calList = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
        });

        const calData = await calList.json();
        const calIds: string[] = calData.items.map((cal : any) => cal.id);

        const { searchParams } = new URL(req.url);
        const weekStartParam = searchParams.get("weekStart");
        const daysParam = searchParams.get("days");

        let timeMin: Date;
        let timeMax: Date;

        if (daysParam) {
            timeMin = new Date();
            timeMin.setHours(0, 0, 0, 0);
            timeMin.setDate(timeMin.getDate() - 7);

            timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + parseInt(daysParam, 10));
            timeMax.setHours(23, 59);
        } else {
            let monday: Date;

            if (weekStartParam) {
                monday = new Date(weekStartParam);
            } else {
                const today = new Date();
                const dayOfWeek = today.getDay();
                monday = new Date(today);
                monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
            }
            monday.setHours(0, 0);

            timeMin = monday;
            timeMax = new Date(monday);
            timeMax.setDate(monday.getDate() + 6);
            timeMax.setHours(23, 59);
        }

        const allEvents = await Promise.all(
            calIds.map(async (calId) => {
                const res = await fetch(
                    "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calId) + "/events?" +
                        new URLSearchParams({
                            orderBy: "startTime",
                            singleEvents: "true",
                            timeMin: timeMin.toISOString(),
                            timeMax: timeMax.toISOString(),
                        }),
                        {
                            headers: {
                                Authorization: `Bearer ${session.accessToken}`,
                            },
                        }
                )
                const data = await res.json();
                return data.items ?? [];
            })
        )
        const events = allEvents
            .flat()
            .sort((a: any, b: any) => {
                const aTime = a.start?.dateTime ?? a.start?.date;
                const bTime = b.start?.dateTime ?? b.start?.date;
                return new Date(aTime).getTime() - new Date(bTime).getTime();
            });

        return NextResponse.json(events);
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {

        const body = await req.json();
        const calendarId = body.calendarId ?? "primary";

        const res = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendarId) + "/events",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    summary: body.summary,
                    start: body.start,
                    end: body.end,
                }),
            }
        );

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    }
}