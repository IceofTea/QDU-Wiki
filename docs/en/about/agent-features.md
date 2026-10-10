# Agent & Community Feature Guide

> This site is one half of a dual-site agent system: "encyclopedia Q&A lives on the Wiki; getting things done lives on Nav."
> This page helps you use all of it — if you find a feature you didn't know about, ask us in the comments.

## 1. "QDU Smart Answer" (bottom-right) · Three-layer recognition

1. **Action intent (layer 1)**: type things like "empty classroom", "timetable", "VPN", "open agent" →
   jumps straight to the matching feature on the navigation site (cross-site, opens in a new tab). The Nav URL is the school-swap target — after a swap it automatically points to the new school.
2. **Encyclopedia Q&A (layer 2)**: local BM25 retrieval over the site's entries (`kb.json`),
   answers come with "view source" — zero external APIs, works offline, **every answer is traceable**.
3. **Fallback guidance (layer 3)**: if nothing matches, you get a hint — **never a fabricated answer**.

## 2. Page comments & paragraph annotations (what community co-building really means)

| Feature | How to use |
|---|---|
| Post a comment | Comment box at the bottom of each page; nickname optional (anonymous); **automatic sensitive-word check** before sending |
| **Select-to-annotate** | Highlight any sentence in the article → "✏️ Annotate selection" → after submitting, that paragraph is highlighted with a 📌 badge |
| Threads | Every comment has "↩ Reply" forming floors; 👍 reactions supported |
| Corrections | "🚩 Something wrong?" → content prefixed with [纠错] enters the maintenance agent's todo list, verified within 24h |
| Real-time | **15-second polling** in server mode — other people's comments appear on your screen automatically |
| Mode | 🟢 Server (shared across users) / 🟡 Local (only you); the banner always shows which |

Report: 🚩 on the right of each comment — fill in a reason to enter the admin queue.

## 3. Reading shortcuts & progress

`j`/`k` scroll pages · `t` back to top · `s` or `/` focus search · `c` jump to comments · `?` shortcut card.
The thin blue bar at the top is your reading progress.

## 4. Admin entrance (regular readers can ignore this section)

Click the **💬 comment badge next to the title 5 times** → enter the passphrase → opens the community console;
or visit the gateway's `/console` or `/.g/9f3a` directly. Five wrong passphrases lock you out for 1 minute.

## 5. Data & privacy

- Comment gateway configured → comments live on the self-hosted campus node (shared across users)
- Not configured → comments stay in your own browser (localStorage), **nothing is uploaded to any third party**
- The sensitive-word list is maintained live by admins; matches are blocked (frontend pre-check + server-side second gate)
