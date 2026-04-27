import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {    

        const calList = await fetch( // get all calendars 
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
        });

        const calData = await calList.json();
        const calIds: string[] = calData.items.map((cal : any) => cal.id); // get the ids of all the calendars

        const today = new Date(); //date handling logic, want to get monday 00:00 and sunday 23:59 of the week the day is in
        const dayOfWeek = today.getDay(); // 1 monday , 2 tuesday ... , 0 sunday

        const monday = new Date(today);
        monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
        monday.setHours(0, 0);

        const sunday = new Date(today);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59);

        const allEvents = await Promise.all(
            calIds.map(async (calId) => {
                const res = await fetch(
                    "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calId) + "/events?" +
                        new URLSearchParams({
                            orderBy: "startTime",
                            singleEvents: "true",
                            timeMin: monday.toISOString(),
                            timeMax: sunday.toISOString(),
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