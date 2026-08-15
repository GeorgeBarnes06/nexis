import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CreateTaskForm from "@/components/CreateTaskForm";
import CompleteTaskButton from "@/components/CompleteTaskButton";

async function getTasks() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch("http://localhost:3000/api/tasks", {
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

export default async function TasksPage() {
    const session = await getServerSession(authOptions);
    const tasks = await getTasks();

    if (!session) {
        return (
            <main className="p-6">
                <p>Please sign in to view your tasks.</p>
            </main>
        );
    }

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tasks</h1>

            <CreateTaskForm />

            <ul className="space-y-2 mt-6">
                {tasks.length === 0 ? (
                    <p className="text-sm text-gray-500">No tasks</p>
                ) : (
                    tasks.map((task: any) => (
                        <li key={task.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                                <p className="font-semibold text-sm">{task.title}</p>
                                <p className="text-xs text-gray-500">
                                    {task.status === "needsAction" ? "To do" : "Completed"}
                                </p>
                            </div>
                            {task.status === "needsAction" && (
                                <CompleteTaskButton taskId={task.id} taskListId={task.taskListId} />
                            )}
                        </li>
                    ))
                )}
            </ul>
        </main>
    );
}