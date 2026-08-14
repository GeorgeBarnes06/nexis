import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {

        const body = await req.json();
        const taskListId = body.taskListId ?? "@default";

        const res = await fetch(
            "https://tasks.googleapis.com/tasks/v1/lists/" + taskListId + "/tasks/" + params.id,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "completed",
                }),
            }
        );

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    }
}