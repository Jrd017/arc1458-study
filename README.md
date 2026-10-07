# Architectural Practice Study

A minimalist, black-and-white ARC1458 study site with a searchable glossary,
three module quizzes, and a combined Module 1 + 2 quiz. Each answer includes
an explanation and a page reference to the supplied PDF.

## Content

The original four-choice questions are in `data/questions.psv`; glossary
entries are in `data/glossary.psv`. Run `python build.py` to regenerate the
JSON files in `dist/`. The site uses plain HTML, CSS, and JavaScript; host
`dist/` as a static website.

The questions are study material based on the supplied course modules. Fee
tables and legal requirements should be checked against current official
documents before professional use.
