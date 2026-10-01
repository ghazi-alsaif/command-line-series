#!/usr/bin/env python3
"""
موسيقى «الهبوط» التصويرية — مركّبة كاملةً من الرياضيات (numpy/scipy)، بلا عيّنات ولا تسجيلات.

تقرأ out/descent-plan.json (المُصدَّر من src/descent/plan.ts) فتلتصق كل لحظة بالصورة:
  • نَفَس الهواء يُشتق من سرعة الكاميرا نفسها إطارًا بإطار.
  • كل حرف يُكتب على الطرفية = نقرة مفتاح في إطاره.
  • لكل كتاب نغمة (سُلّم ري الصغير)؛ تُعزف عند الهبوط عليه، ثم لحنًا حين تجتمع الكتب العشرة.
  • الإيقاع 120 BPM = 15 إطارًا للنبضة؛ كل هبوط على رأس نبضة.

الاستعمال:  python3 scripts/score.py   →  public/audio/descent-score.wav
"""
import json
import os
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
plan = json.load(open(os.path.join(ROOT, "out/descent-plan.json")))

SR = 48000
FPS = plan["FPS"]
SPF = SR // FPS  # عيّنات لكل إطار
TOTAL = plan["TOTAL"]
N = TOTAL * SPF + SR * 3  # ذيل للصدى، يُقصّ لاحقًا
BAR = plan["BAR"]
BEAT = plan["BEAT"]
rng = np.random.default_rng(1969)

dry = np.zeros((N, 2))
wet = np.zeros((N, 2))  # إرسال إلى الصدى
duck = np.ones(N)  # «ضغط جانبي» يتبع الطبل


def fr(f):
    return int(round(f * SPF))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, f, x, gain=1.0, pan=0.0):
    """يضع صوتًا أحاديًا x عند الإطار f بموقع ستيريو pan ∈ [-1,1]."""
    i = fr(f)
    if i >= N:
        return
    x = x[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(x), 0] += x * gain * l
    buf[i : i + len(x), 1] += x * gain * r


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


# ── الآلات ───────────────────────────────────────────────────────────
def saw_voice(freq, n, cutoff, detune_cents=0.0):
    t = np.arange(n) / SR
    f = freq * 2 ** (detune_cents / 1200)
    out = np.zeros(n)
    k = 1
    while f * k < min(cutoff * 3, 9000):
        w = (1 / k) / (1 + (f * k / cutoff) ** 2)
        out += w * np.sin(2 * np.pi * f * k * t + k * 0.7)
        k += 1
    return out


def pad(notes, f0, bars, cutoff=900, gain=0.09, attack=0.5, release=1.2):
    n = fr(bars * BAR) + int(release * SR)
    body = fr(bars * BAR)
    e = np.ones(n)
    a = int(attack * SR)
    e[:a] = np.linspace(0, 1, a) ** 1.5
    e[body:] = np.linspace(1, 0, n - body) ** 2
    for j, m in enumerate(notes):
        for d, p in ((-7, -0.6), (0, 0.0), (7, 0.6)):
            v = saw_voice(mtof(m), n, cutoff, d + (j - 2) * 1.3) * e
            place(dry, f0, v, gain * 0.55, p)
            place(wet, f0, v, gain * 0.5, -p)


def choir(notes, f0, bars, gain=0.05):
    n = fr(bars * BAR) + SR
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.7) * np.clip((n / SR - t) / 1.0, 0, 1)
    for j, m in enumerate(notes):
        f = mtof(m)
        vib = 1 + 0.004 * np.sin(2 * np.pi * (5.1 + j * 0.3) * t)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        v = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.08 * np.sin(5 * ph)) * e
        place(wet, f0, v, gain, (j - 2) * 0.3)
        place(dry, f0, v, gain * 0.35, (j - 2) * 0.3)


def pluck(m, f, gain=0.11, pan=0.0, tau=0.16, bright=2600):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    fq = mtof(m)
    v = np.sin(2 * np.pi * fq * t) + 0.33 * np.sin(2 * np.pi * 3 * fq * t) + 0.2 * np.sin(2 * np.pi * 5 * fq * t)
    v = filt(v * env_exp(n, tau), "lowpass", bright)
    place(dry, f, v, gain, pan)
    place(wet, f, v, gain * 0.6, -pan)


def bell(m, f, gain=0.22, pan=0.0, tail=2.6):
    n = int(tail * SR)
    t = np.arange(n) / SR
    fq = mtof(m)
    v = np.zeros(n)
    for ratio, amp, tau in ((1, 1.0, 1.6), (2.0, 0.45, 0.9), (2.76, 0.35, 0.6), (4.07, 0.2, 0.35), (5.4, 0.12, 0.2)):
        v += amp * np.sin(2 * np.pi * fq * ratio * t) * env_exp(n, tau * tail / 2.6)
    v += 0.3 * np.sin(2 * np.pi * fq / 2 * t) * env_exp(n, 0.8)
    v[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    place(dry, f, v, gain * 0.6, pan)
    place(wet, f, v, gain * 0.9, -pan)


def kick(f, gain=0.6, soft=False):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    fq = 45 + (120 if not soft else 60) * np.exp(-t / 0.035)
    v = np.sin(2 * np.pi * np.cumsum(fq) / SR) * env_exp(n, 0.16 if not soft else 0.22)
    if not soft:
        v[: int(0.004 * SR)] += rng.normal(0, 0.4, int(0.004 * SR))
    place(dry, f, np.tanh(1.6 * v), gain)
    i = fr(f)
    d = 1 - 0.55 * env_exp(int(0.32 * SR), 0.09)
    j = min(N, i + len(d))
    duck[i:j] = np.minimum(duck[i:j], d[: j - i])


def hat(f, gain=0.05, pan=0.25, tau=0.03):
    n = int(0.15 * SR)
    v = filt(rng.normal(0, 1, n), "highpass", 7500) * env_exp(n, tau)
    place(dry, f, v, gain, pan)


def clap(f, gain=0.16):
    n = int(0.35 * SR)
    noise = filt(rng.normal(0, 1, n), "bandpass", [900, 2600])
    e = np.zeros(n)
    for o in (0, 0.011, 0.022):
        k = int(o * SR)
        e[k:] += env_exp(n - k, 0.012 if o < 0.02 else 0.12)
    place(dry, f, noise * e, gain, -0.1)
    place(wet, f, noise * e, gain * 0.5)


def snare(f, gain=0.1):
    n = int(0.2 * SR)
    t = np.arange(n) / SR
    v = filt(rng.normal(0, 1, n), "bandpass", [1200, 6000]) * env_exp(n, 0.05)
    v += 0.5 * np.sin(2 * np.pi * 190 * t) * env_exp(n, 0.04)
    place(dry, f, v, gain)


def sub(m, f, frames, gain=0.2):
    n = fr(frames)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.01) * np.clip((n / SR - t) / 0.04, 0, 1)
    v = np.tanh(1.4 * np.sin(2 * np.pi * mtof(m) * t)) * e
    place(dry, f, v, gain)


def key(f, gain=0.11, seed=0, big=False):
    r = np.random.default_rng(seed)
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    v = filt(r.normal(0, 1, n), "bandpass", [1800 + r.integers(0, 900), 5200]) * env_exp(n, 0.006)
    v += (0.9 if big else 0.5) * np.sin(2 * np.pi * (150 if big else 210 + r.integers(-20, 20)) * t) * env_exp(n, 0.012 if not big else 0.03)
    place(dry, f, v, gain * (1.6 if big else 1.0), r.uniform(-0.3, 0.3))
    place(wet, f, v, gain * 0.25)


def typewriter(f, seed):
    r = np.random.default_rng(seed + 99)
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    v = filt(r.normal(0, 1, n), "bandpass", [2500, 7000]) * env_exp(n, 0.004)
    v += 0.25 * np.sin(2 * np.pi * 3150 * t) * env_exp(n, 0.03)
    v += 0.6 * np.sin(2 * np.pi * 120 * t) * env_exp(n, 0.01)
    place(dry, f, v, 0.1, r.uniform(-0.2, 0.2))
    place(wet, f, v, 0.05)


def boom(f, gain=0.7, length=2.4):
    n = int(length * SR)
    t = np.arange(n) / SR
    fq = 30 + 40 * np.exp(-t / 0.25)
    v = np.sin(2 * np.pi * np.cumsum(fq) / SR) * env_exp(n, 0.7)
    v += filt(rng.normal(0, 1, n), "lowpass", 900) * env_exp(n, 0.12) * 0.5
    place(dry, f, np.tanh(1.3 * v), gain)
    place(wet, f, v, gain * 0.35)


def reverse_swell(f_end, frames, gain=0.18, hp=1500):
    n = fr(frames)
    v = filt(rng.normal(0, 1, n), "highpass", hp)
    e = np.linspace(0, 1, n) ** 3
    place(dry, f_end - frames, v * e, gain, 0.1)
    place(wet, f_end - frames, v * e, gain * 0.7, -0.1)


def impact(f, gain=0.28):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    v = np.sin(2 * np.pi * np.cumsum(55 + 50 * np.exp(-t / 0.04)) / SR) * env_exp(n, 0.14)
    v += filt(rng.normal(0, 1, n), "lowpass", 500) * env_exp(n, 0.03) * 0.6
    place(dry, f, v, gain)


def glitch(f, steps=10, gain=0.06):
    for k in range(steps):
        n = int(0.025 * SR)
        t = np.arange(n) / SR
        fq = [880, 1320, 660, 1760, 990][k % 5]
        v = np.sign(np.sin(2 * np.pi * fq * t)) * env_exp(n, 0.01)
        place(dry, f + k * 0.75, v, gain, ((k * 7) % 5 - 2) / 3)


# ── نَفَس الهواء من سرعة الكاميرا ─────────────────────────────────────
vel = np.abs(np.array(plan["velocity"], dtype=float))
vn = np.clip(vel / 260.0, 0, 1)
venv = np.repeat(vn, SPF)
venv = signal.sosfiltfilt(sos("lowpass", 18), venv)  # تنعيم
venv = np.clip(venv, 0, 1)
L = len(venv)
noise = rng.normal(0, 1, (L, 2))
low = signal.sosfilt(sos("bandpass", [120, 700]), noise, axis=0)
mid = signal.sosfilt(sos("bandpass", [700, 2400]), noise, axis=0)
high = signal.sosfilt(sos("bandpass", [2400, 9000]), noise, axis=0)
air = (low * (venv ** 0.9)[:, None] * 0.55 + mid * (venv ** 1.3)[:, None] * 0.9 + high * (venv ** 2.2)[:, None] * 0.6)
dry[:L] += air * 0.16
wet[:L] += air * 0.05

# ── التأليف ──────────────────────────────────────────────────────────
CH = {
    "Dm": [50, 57, 62, 65, 69],
    "Dm9": [50, 57, 62, 64, 65, 69],
    "Bb": [46, 53, 58, 62, 65],
    "F": [41, 53, 57, 60, 65],
    "C": [48, 55, 60, 64, 67],
    "Gm": [43, 50, 55, 58, 62],
    "Asus": [45, 52, 57, 62, 64],
    "A": [45, 52, 57, 61, 64],
}
prog = {
    1: ("Dm", 900), 2: ("Dm", 1100), 3: ("Bb", 1100), 4: ("F", 1200), 5: ("C", 1300),
    6: ("Dm9", 1400), 7: ("Bb", 1400), 8: ("Gm", 600), 9: ("Asus", 650),
    10: ("Dm", 1800), 11: ("Bb", 2000), 12: ("F", 2200), 13: ("C", 2500), 14: ("A", 3000),
    15: ("Dm", 3200), 16: ("Bb", 3200), 17: ("F", 3000),
    18: ("Bb", 1300), 19: ("F", 1100), 20: ("Dm9", 900),
}
for b, (c, cut) in prog.items():
    length = 1 if b != 14 else 0.72  # نصمت قبل الانفجار
    pad(CH[c], b * BAR, length, cutoff=cut, gain=(0.05 if b in (8, 9) else 0.06) if b < 15 else 0.08, attack=0.35 if b not in (1, 15) else 0.02)

# البداية: نبض قلب خافت + نقرات الكتابة + Enter
for f in (0, 30):
    kick(f, 0.32, soft=True)
for k, f in enumerate(plan["typed"][0]):
    key(f, seed=k)
key(plan["ENTER_AT"], seed=42, big=True)

# الانفجار الأول: الشعار ينبت جذورًا
reverse_swell(60, 22, 0.16)
boom(60, 0.75)
sub(38, 60, 60, 0.18)

# الكتب 1–4 + الضفيرة + 5: نبض هادئ وأربيجيو
for b in range(2, 8):
    c = CH[prog[b][0]]
    up = [c[2] + 12, c[3] + 12, c[4] + 12, c[3] + 12]
    for k in range(8):
        f = b * BAR + k * (BEAT / 2)
        pluck(up[k % 4], f, 0.07 + 0.02 * (k % 2 == 0), pan=((k % 4) - 1.5) / 2.5)
    kick(b * BAR, 0.42, soft=True)
    kick(b * BAR + 2 * BEAT, 0.34, soft=True)
    for k in range(8):
        hat(b * BAR + k * BEAT / 2 + BEAT / 4, 0.02, tau=0.02)
    sub(c[0] - 12 + (12 if c[0] < 44 else 0), b * BAR, BAR - 2, 0.12)

# «رُوحٌ في الآلة»: الموسيقى تهدأ — صندوق موسيقى وآلة كاتبة
for b, notes in ((8, [74, 70, 67, 70]), (9, [76, 73, 69, 73])):
    for k, m in enumerate(notes):
        bell(m + 12, b * BAR + k * BEAT, 0.07, pan=(k - 1.5) / 3, tail=1.6)
q0, qd = plan["QUOTE_REVEAL"]["start"], plan["QUOTE_REVEAL"]["dur"]
for k, f in enumerate(np.arange(q0, q0 + qd - 4, 2.6)):
    typewriter(float(f) + (k % 3) * 0.3, k)
# جرس العودة (الآلة الكاتبة) في آخر الاقتباس
bell(86, q0 + qd - 2, 0.05, tail=1.2)

# التحول إلى الدارات
glitch(586, 12)

# الكتب 7–10: إيقاع كامل
for b in range(10, 14):
    c = CH[prog[b][0]]
    up = [c[2] + 12, c[3] + 12, c[4] + 12, c[3] + 24, c[4] + 12, c[3] + 12, c[2] + 12, c[1] + 12]
    for k in range(16):
        f = b * BAR + k * (BEAT / 4)
        pluck(up[k % 8], f, 0.06 + 0.025 * (k % 4 == 0), pan=np.sin(k * 0.9) * 0.6, tau=0.11, bright=3400)
    for k in range(4):
        kick(b * BAR + k * BEAT, 0.55)
    clap(b * BAR + BEAT, 0.13)
    clap(b * BAR + 3 * BEAT, 0.13)
    for k in range(16):
        hat(b * BAR + k * BEAT / 4, 0.035 if k % 2 else 0.018, pan=0.3 if k % 2 else -0.2)
    bass = c[0] - 12 if c[0] >= 41 else c[0]
    for k in range(8):
        sub(bass + (12 if k % 2 else 0) * 0, b * BAR + k * BEAT / 2, BEAT / 2 - 1, 0.16)

# الطرف: مُصعِّد + لفّة طبل تتسارع، ثم صمت نبضة كاملة
r0, r1 = 14 * BAR, 14 * BAR + 45
n = fr(r1 - r0)
t = np.arange(n) / SR
sweep = filt(rng.normal(0, 1, n), "bandpass", [400, 8000]) * (t / t[-1]) ** 2
place(dry, r0, sweep, 0.14)
place(wet, r0, sweep, 0.12)
riser = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / t[-1])) / SR) * (t / t[-1]) ** 2
place(wet, r0, riser, 0.06)
kick(r0, 0.5)
kick(r0 + BEAT, 0.5)
f = r0 + 2 * BEAT
step = 3.75
while f < r1 - 1:
    snare(f, 0.05 + 0.08 * (f - r0) / 45)
    step = max(1.0, step * 0.86)
    f += step

# الانفجار: الكتب العشرة
H = plan["HERO"]
reverse_swell(H, 14, 0.2, hp=3000)
boom(H, 0.85, 3.0)
choir([62, 65, 69, 74], 15 * BAR, 1, 0.07)
choir([58, 62, 65, 70], 16 * BAR, 1, 0.07)
choir([57, 60, 65, 69], 17 * BAR, 1, 0.07)
for b in (15, 16, 17):
    c = CH[prog[b][0]]
    for k in range(4):
        kick(b * BAR + k * BEAT, 0.55 if b > 15 or k > 0 else 0.0)
    clap(b * BAR + BEAT, 0.12)
    clap(b * BAR + 3 * BEAT, 0.12)
    for k in range(16):
        hat(b * BAR + k * BEAT / 4, 0.03 if k % 2 else 0.015)
    for k in range(8):
        sub(c[0] - 12 if c[0] >= 41 else c[0], b * BAR + k * BEAT / 2, BEAT / 2 - 1, 0.15)
    if b > 15:
        up = [c[2] + 12, c[3] + 12, c[4] + 12, c[3] + 24]
        for k in range(16):
            pluck(up[k % 4], b * BAR + k * BEAT / 4, 0.05, pan=np.sin(k) * 0.5, tau=0.1)
# لحن الكتب العشرة: كل غلاف يهبط على نغمته
for i, (f, m) in enumerate(zip(plan["HERO_LAND"], plan["BOOK_NOTES"])):
    bell(m + 12, f, 0.13, pan=(i - 4.5) / 6, tail=2.0)
    pluck(m + 24, f, 0.04, pan=-(i - 4.5) / 6)
impact(plan["HERO_TEXT"]["count"], 0.3)

# نغمة كل كتاب عند الهبوط عليه
for i, (f, m) in enumerate(zip(plan["LAND"], plan["BOOK_NOTES"])):
    bell(m + 12, f, 0.16 if i != 5 else 0.1, pan=0.15 * ((-1) ** i))
    impact(f, 0.18 if i < 6 else 0.24)
impact(plan["JUNCTION_LAND"], 0.2)
bell(50 + 24, plan["JUNCTION_LAND"], 0.1)
bell(57 + 24, plan["JUNCTION_LAND"] + 2, 0.08)

# الكتابة على الطرفية في الكتب 7–10
for j, frames in enumerate(plan["typed"][1:]):
    for k, f in enumerate(frames):
        key(f, 0.07, seed=100 * j + k)
    key(frames[-1] + 4, 0.08, seed=777 + j, big=True)

# الخاتمة: انفتاح على الورق، ثم الإغلاق على المؤشر
O = plan["OUTRO"]
reverse_swell(O + 4, 16, 0.12, hp=800)
for k, m in enumerate([74, 77, 81, 86]):
    bell(m, O + 20 + k * 7.5, 0.06, pan=(k - 1.5) / 3, tail=3.0)
for b in (18, 19, 20):
    c = CH[prog[b][0]]
    for k in range(4):
        pluck(c[3] + 12 if k % 2 else c[4] + 12, b * BAR + k * BEAT, 0.035, tau=0.4, bright=1800)
LC = plan["LOOP_CLOSE"]
reverse_swell(LC + 26, 24, 0.1, hp=600)
kick(LC + 30, 0.32, soft=True)  # نبض القلب يعود؛ التالي يقع على الإطار 0 حين تُعاد الحلقة

# ── الصدى والمزج ─────────────────────────────────────────────────────
ir_n = int(2.8 * SR)
tt = np.arange(ir_n) / SR
ir = rng.normal(0, 1, (ir_n, 2)) * np.exp(-tt / 0.75)[:, None]
ir[:, 0] = filt(ir[:, 0], "lowpass", 6000)
ir[:, 1] = filt(ir[:, 1], "lowpass", 5500)
ir[: int(0.012 * SR)] = 0  # تأخير مسبق
ir /= np.sqrt((ir ** 2).sum(axis=0))
rev = np.stack([signal.fftconvolve(wet[:, c], ir[:, c])[:N] for c in (0, 1)], axis=1)

# الضغط الجانبي على الوسادة والصدى في المقاطع الإيقاعية
duck_s = signal.sosfiltfilt(sos("lowpass", 40), duck)
mix = dry + rev * 0.9 * duck_s[:, None]
mix = signal.sosfilt(sos("highpass", 28), mix, axis=0)

# قصّ إلى طول الفيديو مع إبقاء ذيل يندمج في الحلقة
out = mix[: TOTAL * SPF]
fade = int(0.08 * SR)
out[:fade] *= np.linspace(0, 1, fade)[:, None] ** 0.5
out = np.tanh(out * 1.1) / np.tanh(1.1)
out /= np.max(np.abs(out)) / 0.89

os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
pcm = (np.clip(out, -1, 1) * 32767).astype("<i2")
import wave

path = os.path.join(ROOT, "out/descent-score-raw.wav")
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("✓", path, f"{len(out) / SR:.2f}s")
