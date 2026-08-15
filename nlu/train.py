import json
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoModel, AutoTokenizer
import torch.nn as nn

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("using device:", device)

with open("processed_dataset.json") as f:
    data = json.load(f)

examples = data["examples"]
intent2id = data["intent2id"]
slot2id = data["slot2id"]
id2intent = {v: k for k, v in intent2id.items()}
id2slot = {v: k for k, v in slot2id.items()}

split = int(len(examples) * 0.9)
train_examples = examples[:split]
val_examples = examples[split:]

class IntentSlotDataset(Dataset):
    def __init__(self, examples):
        self.examples = examples

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        ex = self.examples[idx]
        return {
            "input_ids": torch.tensor(ex["input_ids"]),
            "attention_mask": torch.tensor(ex["attention_mask"]),
            "slot_labels": torch.tensor(ex["slot_labels"]),
            "intent_label": torch.tensor(ex["intent_label"]),
        }

train_dataset = IntentSlotDataset(train_examples)
val_dataset = IntentSlotDataset(val_examples)

train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=16)

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

optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
intent_loss_fn = nn.CrossEntropyLoss()
slot_loss_fn = nn.CrossEntropyLoss(ignore_index=-100)

epochs = 8

for epoch in range(epochs):
    model.train()
    total_loss = 0

    for batch in train_loader:
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        slot_labels = batch["slot_labels"].to(device)
        intent_labels = batch["intent_label"].to(device)

        optimizer.zero_grad()

        intent_logits, slot_logits = model(input_ids, attention_mask)

        intent_loss = intent_loss_fn(intent_logits, intent_labels)
        slot_loss = slot_loss_fn(slot_logits.view(-1, len(slot2id)), slot_labels.view(-1))

        loss = intent_loss + slot_loss
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    avg_train_loss = total_loss / len(train_loader)

    model.eval()
    correct_intents = 0
    total = 0

    with torch.no_grad():
        for batch in val_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            intent_labels = batch["intent_label"].to(device)

            intent_logits, _ = model(input_ids, attention_mask)
            predictions = torch.argmax(intent_logits, dim=1)

            correct_intents += (predictions == intent_labels).sum().item()
            total += intent_labels.size(0)

    val_accuracy = correct_intents / total

    print(f"epoch {epoch + 1}/{epochs}  train_loss {avg_train_loss:.4f}  val_intent_acc {val_accuracy:.4f}")

torch.save({
    "model_state_dict": model.state_dict(),
    "intent2id": intent2id,
    "slot2id": slot2id,
}, "model.pt")

print("\nsaved model to model.pt")