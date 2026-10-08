#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('docs/i18n/en.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Find position 23225 and decode
pos = 23225
surrounding = content[pos-50:pos+50]
print(f"Chars around position {pos}:")
for i, ch in enumerate(surrounding):
    actual_pos = pos - 50 + i
    marker = " <-- HERE" if actual_pos == pos else ""
    print(f"  {actual_pos}: U+{ord(ch):04X} '{ch}'{marker}")
