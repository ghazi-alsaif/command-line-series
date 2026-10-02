"""
آلات موسيقية مركّبة رياضيًا (numpy/scipy) — بلا عيّنات ولا تسجيلات.
تُستعمل في موسيقى الفيديوهات: Studio(total_frames) ثم استدعاء الآلات بالإطار، ثم master().
"""
import wave

import numpy as np
from scipy import signal

SR = 48000
FPS = 30
SPF = SR // FPS


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


class Studio:
    def __init__(self, total_frames, seed=1969, tail=3.0):
        self.total = total_frames
        self.N = total_frames * SPF + int(tail * SR)
        self.dry = np.zeros((self.N, 2))
        self.wet = np.zeros((self.N, 2))
        self.duck = np.ones(self.N)
        self.rng = np.random.default_rng(seed)

    # ── أدوات ──
    def fr(self, f):
        return int(round(f * SPF))

    def place(self, buf, f, x, gain=1.0, pan=0.0):
        i = self.fr(f)
        if i >= self.N or i < 0:
            return
        x = x[: self.N - i]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        buf[i : i + len(x), 0] += x * gain * l
        buf[i : i + len(x), 1] += x * gain * r

    def noise(self, n):
        return self.rng.normal(0, 1, n)

    # ── آلات نغمية ──
    def _saw(self, freq, n, cutoff, cents=0.0):
        t = np.arange(n) / SR
        f = freq * 2 ** (cents / 1200)
        out = np.zeros(n)
        k = 1
        while f * k < min(cutoff * 3, 9000):
            out += (1 / k) / (1 + (f * k / cutoff) ** 2) * np.sin(2 * np.pi * f * k * t + k * 0.7)
            k += 1
        return out

    def pad(self, notes, f0, frames, cutoff=900, gain=0.06, attack=0.5, release=1.2):
        body = self.fr(frames)
        n = body + int(release * SR)
        e = np.ones(n)
        a = max(1, int(attack * SR))
        e[:a] = np.linspace(0, 1, a) ** 1.5
        e[body:] = np.linspace(1, 0, n - body) ** 2
        for j, m in enumerate(notes):
            for d, p in ((-7, -0.6), (0, 0.0), (7, 0.6)):
                v = self._saw(mtof(m), n, cutoff, d + (j - 2) * 1.3) * e
                self.place(self.dry, f0, v, gain * 0.55, p)
                self.place(self.wet, f0, v, gain * 0.5, -p)

    def choir(self, notes, f0, frames, gain=0.05, attack=0.7):
        n = self.fr(frames) + SR
        t = np.arange(n) / SR
        e = np.minimum(1, t / attack) * np.clip((n / SR - t) / 1.0, 0, 1)
        for j, m in enumerate(notes):
            vib = 1 + 0.004 * np.sin(2 * np.pi * (5.1 + j * 0.3) * t)
            ph = 2 * np.pi * np.cumsum(mtof(m) * vib) / SR
            v = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.08 * np.sin(5 * ph)) * e
            self.place(self.wet, f0, v, gain, (j - 2) * 0.3)
            self.place(self.dry, f0, v, gain * 0.35, (j - 2) * 0.3)

    def pluck(self, m, f, gain=0.08, pan=0.0, tau=0.16, bright=2600):
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        fq = mtof(m)
        v = np.sin(2 * np.pi * fq * t) + 0.33 * np.sin(2 * np.pi * 3 * fq * t) + 0.2 * np.sin(2 * np.pi * 5 * fq * t)
        v = filt(v * env_exp(n, tau), "lowpass", bright)
        self.place(self.dry, f, v, gain, pan)
        self.place(self.wet, f, v, gain * 0.6, -pan)

    def bell(self, m, f, gain=0.15, pan=0.0, tail=2.6):
        n = int(tail * SR)
        t = np.arange(n) / SR
        fq = mtof(m)
        v = np.zeros(n)
        for ratio, amp, tau in ((1, 1.0, 1.6), (2.0, 0.45, 0.9), (2.76, 0.35, 0.6), (4.07, 0.2, 0.35), (5.4, 0.12, 0.2)):
            v += amp * np.sin(2 * np.pi * fq * ratio * t) * env_exp(n, tau * tail / 2.6)
        v += 0.3 * np.sin(2 * np.pi * fq / 2 * t) * env_exp(n, 0.8)
        k = int(0.002 * SR)
        v[:k] *= np.linspace(0, 1, k)
        self.place(self.dry, f, v, gain * 0.6, pan)
        self.place(self.wet, f, v, gain * 0.9, -pan)

    def sub(self, m, f, frames, gain=0.15):
        n = self.fr(frames)
        t = np.arange(n) / SR
        e = np.minimum(1, t / 0.01) * np.clip((n / SR - t) / 0.04, 0, 1)
        self.place(self.dry, f, np.tanh(1.4 * np.sin(2 * np.pi * mtof(m) * t)) * e, gain)

    # ── إيقاع ──
    def kick(self, f, gain=0.5, soft=False):
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        fq = 45 + (60 if soft else 120) * np.exp(-t / 0.035)
        v = np.sin(2 * np.pi * np.cumsum(fq) / SR) * env_exp(n, 0.22 if soft else 0.16)
        if not soft:
            k = int(0.004 * SR)
            v[:k] += self.rng.normal(0, 0.4, k)
        self.place(self.dry, f, np.tanh(1.6 * v), gain)
        i = self.fr(f)
        d = 1 - 0.5 * env_exp(int(0.32 * SR), 0.09)
        j = min(self.N, i + len(d))
        self.duck[i:j] = np.minimum(self.duck[i:j], d[: j - i])

    def hat(self, f, gain=0.03, pan=0.25, tau=0.03):
        n = int(0.15 * SR)
        self.place(self.dry, f, filt(self.noise(n), "highpass", 7500) * env_exp(n, tau), gain, pan)

    def shaker(self, f, gain=0.03, pan=-0.2):
        n = int(0.09 * SR)
        e = np.sin(np.linspace(0, np.pi, n)) ** 2
        self.place(self.dry, f, filt(self.noise(n), "bandpass", [4000, 11000]) * e, gain, pan)

    def clap(self, f, gain=0.12):
        n = int(0.35 * SR)
        x = filt(self.noise(n), "bandpass", [900, 2600])
        e = np.zeros(n)
        for o in (0, 0.011, 0.022):
            k = int(o * SR)
            e[k:] += env_exp(n - k, 0.012 if o < 0.02 else 0.12)
        self.place(self.dry, f, x * e, gain, -0.1)
        self.place(self.wet, f, x * e, gain * 0.5)

    # ── مؤثرات ──
    def key(self, f, gain=0.1, seed=0, big=False):
        r = np.random.default_rng(seed)
        n = int(0.06 * SR)
        t = np.arange(n) / SR
        v = filt(r.normal(0, 1, n), "bandpass", [1800 + r.integers(0, 900), 5200]) * env_exp(n, 0.006)
        v += (0.9 if big else 0.5) * np.sin(2 * np.pi * (150 if big else 210 + r.integers(-20, 20)) * t) * env_exp(n, 0.03 if big else 0.012)
        self.place(self.dry, f, v, gain * (1.6 if big else 1.0), r.uniform(-0.3, 0.3))
        self.place(self.wet, f, v, gain * 0.25)

    def blip(self, f, m, gain=0.04, pan=0.0):
        n = int(0.05 * SR)
        t = np.arange(n) / SR
        v = np.sign(np.sin(2 * np.pi * mtof(m) * t)) * env_exp(n, 0.012)
        self.place(self.dry, f, filt(v, "lowpass", 5000), gain, pan)

    def boom(self, f, gain=0.6, length=2.4):
        n = int(length * SR)
        t = np.arange(n) / SR
        v = np.sin(2 * np.pi * np.cumsum(30 + 40 * np.exp(-t / 0.25)) / SR) * env_exp(n, 0.7)
        v += filt(self.noise(n), "lowpass", 900) * env_exp(n, 0.12) * 0.5
        self.place(self.dry, f, np.tanh(1.3 * v), gain)
        self.place(self.wet, f, v, gain * 0.35)

    def swell(self, f_end, frames, gain=0.15, hp=1500):
        n = self.fr(frames)
        v = filt(self.noise(n), "highpass", hp) * np.linspace(0, 1, n) ** 3
        self.place(self.dry, f_end - frames, v, gain, 0.1)
        self.place(self.wet, f_end - frames, v, gain * 0.7, -0.1)

    def whoosh(self, f_mid, frames, gain=0.14, lo=300, hi=3500, pan=0.0):
        n = self.fr(frames)
        x = self.noise(n)
        a = filt(x, "bandpass", [lo, (lo + hi) / 2])
        b = filt(x, "bandpass", [(lo + hi) / 2, hi])
        t = np.linspace(0, 1, n)
        e = np.sin(np.pi * t) ** 2
        v = (a * (1 - t) + b * t) * e
        self.place(self.dry, f_mid - frames / 2, v, gain, pan)
        self.place(self.wet, f_mid - frames / 2, v, gain * 0.4, -pan)

    def thud(self, f, gain=0.4):
        """كتاب يسقط على خشب: جسم منخفض + صفعة ورق."""
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        body = np.sin(2 * np.pi * np.cumsum(52 + 60 * np.exp(-t / 0.03)) / SR) * env_exp(n, 0.07)
        slap = filt(self.noise(n), "bandpass", [250, 2800]) * env_exp(n, 0.018)
        wood = np.sin(2 * np.pi * 180 * t) * env_exp(n, 0.04) * 0.3
        self.place(self.dry, f, np.tanh(1.5 * (body + 0.55 * slap + wood)), gain)
        self.place(self.wet, f, slap, gain * 0.15)

    def switch(self, f, gain=0.35):
        """مفتاح مصباح يُضاء + طنين كهربائي قصير."""
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        v = filt(self.noise(n), "bandpass", [1500, 6000]) * env_exp(n, 0.004)
        v += 0.7 * np.sin(2 * np.pi * 95 * t) * env_exp(n, 0.02)
        self.place(self.dry, f, v, gain)
        self.place(self.wet, f, v, gain * 0.3)

    def hum(self, f0, frames, gain=0.012):
        n = self.fr(frames)
        t = np.arange(n) / SR
        e = np.minimum(1, t / 0.3) * np.clip((n / SR - t) / 1.5, 0, 1)
        v = (np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.2 * np.sin(2 * np.pi * 180 * t)) * e
        self.place(self.dry, f0, v, gain)

    def paper(self, f0, frames, gain=0.12, flutter=14.0):
        """ورقة تنقلب: ضوضاء مرشّحة بارتعاش سريع وغلاف يتبع الحركة."""
        n = self.fr(frames)
        t = np.arange(n) / SR
        x = filt(self.noise(n), "bandpass", [700, 7000])
        shape = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
        fl = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * flutter * t + 3 * np.sin(2 * np.pi * 2.3 * t)))
        self.place(self.dry, f0, x * shape * fl, gain, 0.15)
        self.place(self.wet, f0, x * shape * fl, gain * 0.3)
        # نقرة الاستقرار
        m = int(0.08 * SR)
        flap = filt(self.noise(m), "bandpass", [300, 3000]) * env_exp(m, 0.012)
        self.place(self.dry, f0 + frames - 1, flap, gain * 0.9)

    def riser(self, f0, frames, gain=0.08, base=220, octaves=2):
        n = self.fr(frames)
        t = np.linspace(0, 1, n)
        tone = np.sin(2 * np.pi * np.cumsum(base * 2 ** (octaves * t)) / SR) * t ** 2
        sweep = filt(self.noise(n), "bandpass", [400, 8000]) * t ** 2
        self.place(self.wet, f0, tone, gain * 0.7)
        self.place(self.dry, f0, sweep, gain)

    # ── المزج النهائي ──
    def master(self, path, fade_out_frames=0):
        rng = np.random.default_rng(3)
        ir_n = int(2.8 * SR)
        tt = np.arange(ir_n) / SR
        ir = rng.normal(0, 1, (ir_n, 2)) * np.exp(-tt / 0.75)[:, None]
        ir[:, 0] = filt(ir[:, 0], "lowpass", 6000)
        ir[:, 1] = filt(ir[:, 1], "lowpass", 5500)
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum(axis=0))
        rev = np.stack([signal.fftconvolve(self.wet[:, c], ir[:, c])[: self.N] for c in (0, 1)], axis=1)
        duck = signal.sosfiltfilt(sos("lowpass", 40), self.duck)
        mix = self.dry + rev * 0.9 * duck[:, None]
        mix = signal.sosfilt(sos("highpass", 28), mix, axis=0)
        out = mix[: self.total * SPF]
        k = int(0.05 * SR)
        out[:k] *= np.linspace(0, 1, k)[:, None]
        if fade_out_frames:
            m = self.fr(fade_out_frames)
            out[-m:] *= np.linspace(1, 0, m)[:, None] ** 1.5
        out = np.tanh(out * 1.1) / np.tanh(1.1)
        out /= np.max(np.abs(out)) / 0.89
        pcm = (np.clip(out, -1, 1) * 32767).astype("<i2")
        with wave.open(path, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        return len(out) / SR
