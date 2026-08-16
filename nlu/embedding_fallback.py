import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

embed_tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
embed_model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2").to(device)
embed_model.eval()

def mean_pooling(token_embeddings, attention_mask):
    mask = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    summed = torch.sum(token_embeddings * mask, dim=1)
    counts = torch.clamp(mask.sum(dim=1), min=1e-9)
    return summed / counts

def embed(sentences):
    encoding = embed_tokenizer(
        sentences,
        padding=True,
        truncation=True,
        return_tensors="pt",
    ).to(device)

    with torch.no_grad():
        outputs = embed_model(**encoding)

    pooled = mean_pooling(outputs.last_hidden_state, encoding["attention_mask"])
    normalized = torch.nn.functional.normalize(pooled, p=2, dim=1)

    return normalized.cpu().numpy()

reference_examples = {
    "add_event": [
        "schedule a meeting for tomorrow",
        "i've got a dentist appointment next week",
        "put this on my calendar",
        "book an appointment for Friday",
        "i have something on tomorrow at 3",
        "block out time for the gym",
        "set up a call with the team",
    ],
    "add_task": [
        "remind me to buy milk",
        "add this to my todo list",
        "i need to call mum",
        "don't let me forget to submit this",
        "i should really finish that report",
        "note to self, renew my passport",
    ],
    "complete_task": [
        "mark that as done",
        "i finished the report",
        "tick off buy milk",
        "i'm done with that task",
        "just completed the assignment",
    ],
    "list_today": [
        "what's on today",
        "show me my schedule",
        "what have i got going on",
        "what does today look like",
    ],
    "unknown": [
        "what's the weather like",
        "tell me a joke",
        "what time is it",
        "play some music",
        "how are you",
    ],
}

reference_embeddings = {
    intent: embed(sentences)
    for intent, sentences in reference_examples.items()
}

def classify_by_similarity(text: str):
    query_embedding = embed([text])[0]

    best_intent = None
    best_score = -1.0

    for intent, embeddings in reference_embeddings.items():
        similarities = embeddings @ query_embedding
        max_sim = float(similarities.max())

        if max_sim > best_score:
            best_score = max_sim
            best_intent = intent

    return best_intent, best_score