import json
import random

random.seed(42)

titles = [
    "call the dentist", "buy milk", "finish the report", "walk the dog",
    "email Sarah", "book flights", "pay the electricity bill", "clean the kitchen",
    "review pull request", "renew passport", "pick up groceries", "call mum",
    "submit assignment", "water the plants", "fix the bike", "read chapter 5",
    "book a haircut", "send invoice", "backup files", "plan the trip",
    "footy", "gym", "yoga class", "team meeting", "dinner with friends",
    "dentist appointment", "doctor appointment", "job interview",
]

dates = [
    "tomorrow", "tomorrow at 3pm", "today", "tonight", "next Tuesday",
    "next Monday at 9am", "in 2 hours", "in 30 minutes", "this weekend",
    "on Friday", "at 5pm", "next week", "on the 20th of August",
    "Saturday morning", "in 3 days",
]

add_event_templates = [
    "schedule {title} {date}",
    "add event {title} {date}",
    "book {title} {date}",
    "set up a meeting for {title} {date}",
    "put {title} on my calendar {date}",
    "schedule a meeting with {title} {date}",
    "book an appointment for {title} {date}",
    "create an event for {title} {date}",
    "i have {title} {date}",
    "plan {title} {date}",
    "add {title} to calendar {date}",
    "add {title} to my calendar {date}",
    "i've got {title} {date}",
    "i have an appointment for {title} {date}",
]

update_event_templates = [
    "move {title} to {date}",
    "reschedule {title} to {date}",
    "change {title} to {date}",
    "push {title} back to {date}",
    "shift {title} to {date}",
    "move {title} to {date} instead",
]

update_event_range_templates = [
    "move {title} from {olddate} to {date}",
    "reschedule {title} from {olddate} to {date}",
    "change {title} from {olddate} to {date}",
    "move {title} event from {olddate} to {date}",
]

add_task_templates = [
    "remind me to {title} {date}",
    "add task {title}",
    "add {title} to my todo list {date}",
    "i need to {title} {date}",
    "todo: {title} {date}",
    "don't forget to {title} {date}",
    "i have to {title} {date}",
    "make sure i {title} {date}",
    "add a task to {title} {date}",
    "remember to {title} {date}",
]

complete_task_templates = [
    "mark {title} as done",
    "complete {title}",
    "finish {title}",
    "i finished {title}",
    "done with {title}",
]

list_today_templates = [
    "what's today",
    "whats today",
    "show me today's schedule",
    "what do i have today",
    "what's on today",
]

unknown_templates = [
    "how's the weather",
    "tell me a joke",
    "what time is it",
    "hello",
    "thanks",
]

def build_example(template, intent, title, date):
    text = template.format(title=title, date=date).strip()
    text = " ".join(text.split())

    parts = template.replace("{title}", "\x00TITLE\x00").replace("{date}", "\x00DATE\x00")
    segments = parts.split("\x00")

    tokens = []
    tags = []

    for segment in segments:
        if segment == "TITLE":
            title_words = title.split()
            for i, w in enumerate(title_words):
                tokens.append(w)
                tags.append("B-TITLE" if i == 0 else "I-TITLE")
        elif segment == "DATE":
            date_words = date.split()
            for i, w in enumerate(date_words):
                tokens.append(w)
                tags.append("B-DATE" if i == 0 else "I-DATE")
        else:
            words = [w for w in segment.strip().split() if w]
            for w in words:
                tokens.append(w)
                tags.append("O")

    return {
        "text": text,
        "tokens": tokens,
        "tags": tags,
        "intent": intent,
    }

def build_example_range(template, intent, title, old_date, date):
    text = template.format(title=title, olddate=old_date, date=date).strip()
    text = " ".join(text.split())

    parts = template.replace("{title}", "\x00TITLE\x00")
    parts = parts.replace("{olddate}", "\x00OLDDATE\x00")
    parts = parts.replace("{date}", "\x00DATE\x00")
    segments = parts.split("\x00")

    tokens = []
    tags = []

    for segment in segments:
        if segment == "TITLE":
            title_words = title.split()
            for i, w in enumerate(title_words):
                tokens.append(w)
                tags.append("B-TITLE" if i == 0 else "I-TITLE")
        elif segment == "OLDDATE":
            for w in old_date.split():
                tokens.append(w)
                tags.append("O")
        elif segment == "DATE":
            date_words = date.split()
            for i, w in enumerate(date_words):
                tokens.append(w)
                tags.append("B-DATE" if i == 0 else "I-DATE")
        else:
            words = [w for w in segment.strip().split() if w]
            for w in words:
                tokens.append(w)
                tags.append("O")

    return {
        "text": text,
        "tokens": tokens,
        "tags": tags,
        "intent": intent,
    }

def generate():
    examples = []

    for template in add_event_templates:
        for title in titles:
            for date in random.sample(dates, 3):
                examples.append(build_example(template, "add_event", title, date))

    for template in update_event_templates:
        for title in titles:
            for date in random.sample(dates, 3):
                examples.append(build_example(template, "update_event", title, date))

    for template in update_event_range_templates:
        for title in titles:
            two_dates = random.sample(dates, 2)
            old_date, date = two_dates[0], two_dates[1]
            examples.append(build_example_range(template, "update_event", title, old_date, date))

    for template in add_task_templates:
        for title in titles:
            for date in random.sample(dates, 3):
                examples.append(build_example(template, "add_task", title, date))

    for template in complete_task_templates:
        for title in titles:
            examples.append(build_example(template, "complete_task", title, ""))

    for template in list_today_templates:
        examples.append({
            "text": template,
            "tokens": template.split(),
            "tags": ["O"] * len(template.split()),
            "intent": "list_today",
        })

    for template in unknown_templates:
        examples.append({
            "text": template,
            "tokens": template.split(),
            "tags": ["O"] * len(template.split()),
            "intent": "unknown",
        })

    random.shuffle(examples)
    return examples

if __name__ == "__main__":
    dataset = generate()
    print(f"generated {len(dataset)} examples")
    print(json.dumps(dataset[:5], indent=2))

    with open("dataset.json", "w") as f:
        json.dump(dataset, f, indent=2)