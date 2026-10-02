#!/usr/bin/env python3
"""
موسيقى «رف السلسلة» — مربوطة بخطة الفيديو (out/shelf-plan.json من src/shelf/plan.ts).
  • نقرات الكتابة، ثم مفتاح المصباح وطنينه.
  • كل كتاب يسقط = نَفَس هواء + ارتطام على خشب + نغمته (سُلّم ري الصغير صاعدًا).
  • الكتب ترتفع إلى اللولب: لمعة صاعدة لكل كتاب بترتيبه.
  • الغلاف يُفتح والورقة تنقلب بصوت ورق، ثم مُصعِّد يذوب في نور الصفحة.

الاستعمال: python3 scripts/score_shelf.py  →  out/shelf-score-raw.wav
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from synth import Studio  # noqa: E402

ROOT = os.path.dirname(HERE)
P = json.load(open(os.path.join(ROOT, "out/shelf-plan.json")))
BAR, BEAT = P["BAR"], P["BEAT"]
S = Studio(P["TOTAL"], seed=2026)

CH = {
    "Dm": [50, 57, 62, 65, 69], "Dm9": [50, 57, 62, 64, 65, 69], "Bb": [46, 53, 58, 62, 65],
    "F": [41, 53, 57, 60, 65], "C": [48, 55, 60, 64, 67], "Gm": [43, 50, 55, 58, 62],
    "A": [45, 52, 57, 61, 64], "Fadd9": [41, 53, 55, 57, 60, 65],
}

# ── الظلام والطرفية ──────────────────────────────────────────────────
for f in (0, 30):
    S.kick(f, 0.22, soft=True)
for k, f in enumerate(P["typed"]):
    S.key(f, seed=k)
S.key(P["ENTER"], seed=99, big=True)
for k in range(10):  # سطور ناتج ls
    S.blip(P["ENTER"] + 1 + k * 0.45, 76 + (k % 5) * 2, 0.025, pan=(k % 2) * 0.4 - 0.2)

# ── المصباح ──────────────────────────────────────────────────────────
L = P["LIGHT_ON"]
S.switch(L)
S.switch(L + 2, 0.12)
S.hum(L, P["LIFT"] - L, 0.01)

# ── البرج ────────────────────────────────────────────────────────────
prog = {1: "Dm", 2: "Bb", 3: "F", 4: "C", 5: "Dm", 6: "Bb", 7: "F", 8: "Gm", 9: "A"}
for b, c in prog.items():
    S.pad(CH[c], b * BAR, BAR, cutoff=700 + b * 120, gain=0.045 + b * 0.003, attack=0.4 if b > 1 else 1.2)
for b in range(2, 8):
    c = CH[prog[b]]
    S.kick(b * BAR, 0.36, soft=True)
    S.kick(b * BAR + 2 * BEAT, 0.3, soft=True)
    S.sub(c[0] - 12 if c[0] >= 44 else c[0], b * BAR, BAR - 2, 0.09)
    if b >= 3:
        up = [c[2] + 12, c[3] + 12, c[4] + 12, c[3] + 12]
        for k in range(8):
            S.pluck(up[k % 4], b * BAR + k * BEAT / 2, 0.045 + 0.015 * (k % 2 == 0), pan=((k % 4) - 1.5) / 2.5)
    if b >= 4:
        for k in range(8):
            S.shaker(b * BAR + k * BEAT / 2 + BEAT / 4, 0.022)

for i, (land, m) in enumerate(zip(P["LAND"], P["BOOK_NOTES"])):
    S.whoosh(land - 6, 14, 0.1, 200, 1800, pan=0.1 * ((-1) ** i))
    S.thud(land, 0.42 if i < 4 else 0.32)
    S.bell(m + 12, land + 1, 0.11, pan=0.12 * ((-1) ** i))

# ── البرج كاملًا ─────────────────────────────────────────────────────
C = P["COUNT"]
S.swell(C + 16, 14, 0.12)
S.boom(C + 16, 0.45, 2.2)
S.choir([62, 65, 70, 74], C, 2 * BAR, 0.05)

# ── اللولب: الكتب ترتفع، درج يصعد ─────────────────────────────────────
for i, f in enumerate(P["lifts"]):
    S.whoosh(f + P["LIFT_DUR"] / 2, P["LIFT_DUR"], 0.06, 600, 6000, pan=(i - 4.5) / 6)
    S.pluck(P["BOOK_NOTES"][i] + 24, f + P["LIFT_DUR"] - 6, 0.04, pan=(i - 4.5) / 6, tau=0.3)
helix = {10: "Dm9", 11: "Bb", 12: "F", 13: "C"}
for b, c in helix.items():
    S.pad(CH[c], b * BAR, BAR, cutoff=1500, gain=0.055)
    S.choir([n + 12 for n in CH[c][2:5]], b * BAR, BAR, 0.025)
    S.kick(b * BAR, 0.4)
    S.kick(b * BAR + 2 * BEAT, 0.34)
    S.clap(b * BAR + 3 * BEAT, 0.07)
    for k in range(16):
        S.hat(b * BAR + k * BEAT / 4, 0.022 if k % 2 else 0.01)
    up = [CH[c][2] + 12, CH[c][3] + 12, CH[c][4] + 12, CH[c][3] + 24]
    for k in range(16):
        S.pluck(up[k % 4], b * BAR + k * BEAT / 4, 0.03, pan=((k * 5) % 7 - 3) / 4, tau=0.12)
    S.sub(CH[c][0] - 12 if CH[c][0] >= 44 else CH[c][0], b * BAR, BAR - 2, 0.1)

# ── الكتاب الأول يتقدّم ويُفتح ───────────────────────────────────────
F = P["FRONT"]
S.whoosh(F + 22, 40, 0.12, 150, 2500)
S.pad(CH["Gm"], 14 * BAR, BAR, cutoff=800, gain=0.05)
S.pad(CH["Dm9"], 15 * BAR, 2 * BAR, cutoff=900, gain=0.05)
o0, o1 = P["OPEN"]
S.paper(o0 + 4, o1 - o0 - 6, 0.1, flutter=6)
S.thud(o1 - 1, 0.12)
t0, t1 = P["TURN"]
S.paper(t0, t1 - t0, 0.13, flutter=16)
S.bell(74 + 12, t1, 0.07)
S.bell(77 + 12, t1 + 6, 0.05)

# ── الدخول في الصفحة ─────────────────────────────────────────────────
d0, d1 = P["DOLLY"]
v0, v1 = P["DIVE"]
S.riser(d0 + 10, v1 - d0 - 10, 0.07, base=147, octaves=2)
S.swell(v1, 18, 0.12, hp=2500)
S.choir([53, 57, 60, 65, 69, 72], v1, 3 * BAR, 0.06, attack=0.15)
for k, m in enumerate([74, 77, 81, 84, 86]):
    S.bell(m, v1 + k * 4, 0.06, pan=(k - 2) / 3, tail=3.2)

# ── الخاتمة ──────────────────────────────────────────────────────────
for b, c in ((18, "Fadd9"), (19, "Bb"), (20, "Dm9")):
    S.pad(CH[c], b * BAR, BAR, cutoff=1100, gain=0.05)
    for k in range(4):
        S.pluck(CH[c][3] + 12 if k % 2 else CH[c][4] + 12, b * BAR + k * BEAT, 0.025, tau=0.45, bright=1800)

dur = S.master(os.path.join(ROOT, "out/shelf-score-raw.wav"), fade_out_frames=P["FADE"][1] - P["FADE"][0])
print(f"✓ out/shelf-score-raw.wav {dur:.2f}s")
