// Actions the assistant proposes and the user confirms before they're executed.
export type AssistantAction =
    | { type: "add_event"; title: string; datetime: string }
    | { type: "add_task"; title: string; datetime: string | null }
    | {
          type: "update_event";
          title: string;
          eventId: string;
          oldDatetime: string;
          newDatetime: string;
          newEndDatetime: string;
      }
    | { type: "complete_task"; title: string; taskId: string; taskListId: string }
    | { type: "delete_task"; title: string; taskId: string; taskListId: string }
    | { type: "delete_event"; title: string; eventId: string };

export type TodaySummary = {
    events: { title?: string; time: string | null }[];
    tasks: { title: string }[];
};
