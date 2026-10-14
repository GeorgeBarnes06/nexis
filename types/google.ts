// The subset of Google API response fields Nexis actually uses.

export type CalendarEvent = {
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
};

export type CalendarListEntry = {
    id: string;
};

export type Task = {
    id: string;
    title: string;
    status: "needsAction" | "completed";
    due?: string;
    taskListId: string; // added by /api/tasks, not part of Google's response
};

export type TaskList = {
    id: string;
};

export type GmailMessageRef = {
    id: string;
};
