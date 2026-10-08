#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('docs/i18n/en.json', 'rb') as f:
    data = f.read()

# Find position 23225
pos = 23225
print(f"Bytes around position {pos}:")
for i in range(max(0, pos-50), min(len(data), pos+50)):
    b = data[i]
    marker = " <-- HERE" if i == pos else ""
    print(f"  {i}: 0x{b:02x} ({chr(b) if 32 <= b < 127 else '.'}){marker}")
