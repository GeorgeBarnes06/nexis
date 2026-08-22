import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	} else {

		const { id } = await params;
		const body = await req.json();
		const calendarId = body.calendarId ?? "primary";

		const res = await fetch(
			"https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendarId) + "/events/" + id,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${session.accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					start: body.start,
					end: body.end,
				}),
			}
		);

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	} else {

		const { id } = await params;
		const { searchParams } = new URL(req.url);
		const calendarId = searchParams.get("calendarId") ?? "primary";

		const res = await fetch(
			"https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendarId) + "/events/" + id,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${session.accessToken}`,
				},
			}
		);

		if (res.status === 204) {
			return NextResponse.json({ success: true });
		}

		const data = await res.json().catch(() => ({}));
		return NextResponse.json(data, { status: res.status });
	}
}