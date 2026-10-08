#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

with open('docs/i18n/en.json', 'r', encoding='utf-8') as f:
    content = f.read()

try:
    data = json.loads(content)
    print("JSON is valid!")
    print("Global keys:", len(data['global']))
    print("Pages keys:", len(data['pages']))
except json.JSONDecodeError as e:
    print(f"JSON error at line {e.lineno}, col {e.colno}, pos {e.pos}")
    # Show the problematic area
    start = max(0, e.pos - 100)
    end = min(len(content), e.pos + 100)
    print("Context:")
    print(repr(content[start:end]))
    print(" " * (e.pos - start) + "^ here")
