import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    const session = await getServerSession(authOptions);
        if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {

        const taskList = await fetch(
            "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            }
        )

        const taskListData = await taskList.json();
        const taskListIds: string[] = taskListData.items.map((taskId : any) => taskId.id);

        const allTasks = await Promise.all(
            taskListIds.map(async (taskListId) => {
                const res = await fetch(
                    "https://tasks.googleapis.com/tasks/v1/lists/" + taskListId + "/tasks",
                    {
                        headers: {
                            authorization: `Bearer ${session.accessToken}`,
                        }
                    }
                )   
            
                const data = await res.json();
                return data.items ?? [];
            })
        )
        
        const tasks = allTasks.flat();

        return NextResponse.json(tasks)
    }
}