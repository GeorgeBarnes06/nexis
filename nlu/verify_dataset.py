import json

with open("dataset.json") as f:
    dataset = json.load(f)

errors = 0

for i, example in enumerate(dataset):
    tokens = example["tokens"]
    tags = example["tags"]
    text_word_count = len(example["text"].split())

    if len(tokens) != len(tags):
        print(f"[{i}] token/tag length mismatch: {len(tokens)} tokens, {len(tags)} tags")
        errors += 1

    if len(tokens) != text_word_count:
        print(f"[{i}] token/text mismatch: {len(tokens)} tokens vs {text_word_count} words in text")
        print(f"    text: {example['text']}")
        print(f"    tokens: {tokens}")
        errors += 1

print(f"\nchecked {len(dataset)} examples, {errors} errors found")