#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re
import json

with open('docs/i18n/en.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Find lines with unescaped double quotes inside string values
lines = content.split('\n')
problem_lines = []
for i, line in enumerate(lines):
    stripped = line.strip()
    # Check for lines that have key-value pairs
    if stripped.startswith('"') and ': "' in stripped:
        # Try to parse just the key
        colon_idx = stripped.index(': "')
        key_part = stripped[:colon_idx+1]
        val_part = stripped[colon_idx+2:]  # after ': "'
        # Remove trailing comma if present
        if val_part.endswith(','):
            val_part = val_part[:-1]
        if val_part.endswith('"'):
            inner = val_part[1:-1]  # strip outer quotes
            if '"' in inner:
                problem_lines.append((i+1, stripped[:120]))

for line_num, text in problem_lines:
    print(f"Line {line_num}: {text}")

print(f"\nTotal problem lines: {len(problem_lines)}")
