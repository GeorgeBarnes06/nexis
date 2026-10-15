import contextlib
import io
import json
import string
import sys
from collections import defaultdict

# importing serve loads model.pt and the fallback embeddings, same as the live service
from serve import predict

test_path = sys.argv[1] if len(sys.argv) > 1 else "test_set.json"

with open(test_path) as f:
    test_set = json.load(f)

def normalise(span):
    if span is None:
        return None
    return " ".join(span.lower().strip(string.punctuation + " ").split())

def spans(title, date):
    result = set()
    if normalise(title):
        result.add(("TITLE", normalise(title)))
    if normalise(date):
        result.add(("DATE", normalise(date)))
    return result

intent_correct = 0
per_intent = defaultdict(lambda: [0, 0])  # intent -> [correct, total]
fallback_used = 0
fallback_correct = 0
true_pos = false_pos = false_neg = 0
failures = []

for example in test_set:
    with contextlib.redirect_stdout(io.StringIO()):  # serve.predict logs every call
        pred = predict(example["text"])

    gold_intent = example["intent"]
    intent_ok = pred["intent"] == gold_intent

    intent_correct += intent_ok
    per_intent[gold_intent][0] += intent_ok
    per_intent[gold_intent][1] += 1

    if pred["used_fallback"]:
        fallback_used += 1
        fallback_correct += intent_ok

    gold_spans = spans(example.get("title"), example.get("date"))
    pred_spans = spans(pred["title"], pred["date_text"])

    true_pos += len(gold_spans & pred_spans)
    false_pos += len(pred_spans - gold_spans)
    false_neg += len(gold_spans - pred_spans)

    if not intent_ok or gold_spans != pred_spans:
        failures.append((example, pred))

total = len(test_set)
precision = true_pos / (true_pos + false_pos) if true_pos + false_pos else 0.0
recall = true_pos / (true_pos + false_neg) if true_pos + false_neg else 0.0
f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0

print(f"examples: {total}")
print(f"intent accuracy: {intent_correct / total:.3f}  ({intent_correct}/{total})")
print(f"slot span F1:    {f1:.3f}  (precision {precision:.3f}, recall {recall:.3f})")
print(f"fallback used:   {fallback_used}/{total}  ({fallback_correct} correct)")

print("\nper intent:")
for intent, (correct, count) in sorted(per_intent.items()):
    print(f"  {intent:<14} {correct}/{count}")

if failures:
    print(f"\nfailures ({len(failures)}):")
    for example, pred in failures:
        print(f"\n  {example['text']!r}")
        print(f"    expected: {example['intent']:<14} title={example.get('title')!r}  date={example.get('date')!r}")
        print(f"    got:      {pred['intent']:<14} title={pred['title']!r}  date={pred['date_text']!r}"
              f"  (conf {pred['confidence']:.2f}{', fallback' if pred['used_fallback'] else ''})")
