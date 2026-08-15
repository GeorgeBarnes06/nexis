import json
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

with open("dataset.json") as f:
    dataset = json.load(f)

intent_labels = sorted(set(example["intent"] for example in dataset))
intent2id = {label: i for i, label in enumerate(intent_labels)}

slot_labels = sorted(set(tag for example in dataset for tag in example["tags"]))
slot2id = {label: i for i, label in enumerate(slot_labels)}

print("intents:", intent2id)
print("slots:", slot2id)

def align_labels(tokens, tags):
    encoding = tokenizer(
        tokens,
        is_split_into_words=True,
        truncation=True,
        padding="max_length",
        max_length=32,
    )

    word_ids = encoding.word_ids()
    aligned_tags = []
    previous_word_id = None

    for word_id in word_ids:
        if word_id is None:
            aligned_tags.append(-100)
        elif word_id != previous_word_id:
            aligned_tags.append(slot2id[tags[word_id]])
        else:
            aligned_tags.append(-100)
        previous_word_id = word_id

    return encoding, aligned_tags

processed = []

for example in dataset:
    encoding, aligned_tags = align_labels(example["tokens"], example["tags"])
    processed.append({
        "input_ids": encoding["input_ids"],
        "attention_mask": encoding["attention_mask"],
        "slot_labels": aligned_tags,
        "intent_label": intent2id[example["intent"]],
    })

with open("processed_dataset.json", "w") as f:
    json.dump({
        "examples": processed,
        "intent2id": intent2id,
        "slot2id": slot2id,
    }, f)

print(f"\nprocessed {len(processed)} examples")
print("\nexample 0:")
print("tokens:", dataset[0]["tokens"])
print("input_ids:", processed[0]["input_ids"][:15], "...")
print("slot_labels:", processed[0]["slot_labels"][:15], "...")
print("intent_label:", processed[0]["intent_label"])