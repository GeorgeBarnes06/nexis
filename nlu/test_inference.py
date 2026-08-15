import json
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

checkpoint = torch.load("model.pt", map_location=device, weights_only=False)
intent2id = checkpoint["intent2id"]
slot2id = checkpoint["slot2id"]
id2intent = {v: k for k, v in intent2id.items()}
id2slot = {v: k for k, v in slot2id.items()}

class IntentSlotModel(nn.Module):
    def __init__(self, num_intents, num_slots):
        super().__init__()
        self.bert = AutoModel.from_pretrained("distilbert-base-uncased")
        hidden_size = self.bert.config.hidden_size
        self.intent_head = nn.Linear(hidden_size, num_intents)
        self.slot_head = nn.Linear(hidden_size, num_slots)
        self.dropout = nn.Dropout(0.1)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        sequence_output = outputs.last_hidden_state
        pooled_output = sequence_output[:, 0, :]

        intent_logits = self.intent_head(self.dropout(pooled_output))
        slot_logits = self.slot_head(self.dropout(sequence_output))

        return intent_logits, slot_logits

model = IntentSlotModel(num_intents=len(intent2id), num_slots=len(slot2id)).to(device)
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

def predict(text):
    words = text.split()

    encoding = tokenizer(
        words,
        is_split_into_words=True,
        truncation=True,
        padding="max_length",
        max_length=32,
        return_tensors="pt",
    )

    input_ids = encoding["input_ids"].to(device)
    attention_mask = encoding["attention_mask"].to(device)
    word_ids = encoding.word_ids()

    with torch.no_grad():
        intent_logits, slot_logits = model(input_ids, attention_mask)

    intent_pred = torch.argmax(intent_logits, dim=1).item()
    intent = id2intent[intent_pred]

    slot_preds = torch.argmax(slot_logits, dim=2)[0].tolist()

    word_tags = {}
    for token_idx, word_id in enumerate(word_ids):
        if word_id is not None and word_id not in word_tags:
            word_tags[word_id] = id2slot[slot_preds[token_idx]]

    tagged_words = [(words[i], word_tags.get(i, "O")) for i in range(len(words))]

    return intent, tagged_words

test_sentences = [
    "remind me to call the dentist tomorrow at 3pm",
    "schedule a meeting with Sarah next Tuesday at 10am",
    "add task buy milk",
    "what's today",
    "mark buy milk as done",
    "how's the weather today",
    "don't forget to pick up dry cleaning on Friday",
    "book a dentist appointment for next Monday",
]

for text in test_sentences:
    intent, tagged_words = predict(text)
    print(f"\n{text}")
    print(f"  intent: {intent}")
    print(f"  slots: {tagged_words}")