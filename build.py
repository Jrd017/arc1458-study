from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
DIST = ROOT / "dist"


def rows(name: str, fields: int):
    for number, line in enumerate((DATA / name).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.startswith("#"):
            continue
        cells = [cell.strip() for cell in line.split("|")]
        if len(cells) != fields:
            raise ValueError(f"{name}:{number}: expected {fields} fields, got {len(cells)}")
        yield number, cells


questions = []
for _, (module, page, topic, prompt, correct, wrong1, wrong2, wrong3, explanation) in rows("questions.psv", 9):
    number = len(questions) + 1
    choices = [correct, wrong1, wrong2, wrong3]
    if len(set(choices)) != 4:
        raise ValueError(f"Question {number} has duplicate options")
    offset = (number * 3 + int(module)) % 4
    choices = choices[offset:] + choices[:offset]
    questions.append({
        "id": f"m{module}-{number}",
        "module": int(module),
        "page": int(page),
        "topic": topic,
        "question": prompt,
        "options": choices,
        "answer": choices.index(correct),
        "explanation": explanation,
    })

counts = Counter(q["module"] for q in questions)
if any(counts[module] <= 50 for module in (1, 2, 3)):
    raise ValueError(f"Each module must have more than 50 questions: {counts}")
if len({q["question"] for q in questions}) != len(questions):
    raise ValueError("Duplicate question text")
for question in questions:
    limit = {1: 8, 2: 24, 3: 45}[question["module"]]
    if not (1 <= question["page"] <= limit):
        raise ValueError(f"Bad source page: {question['id']}")

glossary = [
    {"module": int(module), "page": int(page), "term": term, "definition": definition}
    for _, (module, page, term, definition) in rows("glossary.psv", 4)
]

# The combined set samples the full span of each module, keeping the original
# questions and their source references intact.
combined = []
for module in (1, 2):
    pool = [q for q in questions if q["module"] == module]
    indices = [round(i * (len(pool) - 1) / 29) for i in range(30)]
    combined.extend(pool[index] for index in indices)
combined = [item for pair in zip(combined[:30], combined[30:]) for item in pair]

DIST.mkdir(exist_ok=True)
for name, data in (("questions.json", questions), ("glossary.json", glossary), ("combined.json", combined)):
    (DIST / name).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

print(f"Questions: {dict(counts)}; combined: {len(combined)}; glossary: {len(glossary)}")
