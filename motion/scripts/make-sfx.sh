#!/usr/bin/env bash
# يولّد المؤثرات الصوتية للفيديو تركيبًا رياضيًا بـ ffmpeg (بلا أي مادة مسجّلة أو مرخّصة).
# الناتج: public/sfx/*.mp3 — أعد التشغيل متى أردت تعديل الصوت.
set -euo pipefail
cd "$(dirname "$0")/.."
out=public/sfx
mkdir -p "$out"
enc=(-c:a libmp3lame -q:a 3 -ar 44100)

# نفَس هواء ناعم (whoosh): ضجيج وردي بمرشّح يتحرّك مع غلاف صعود/هبوط
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.9:c=pink:a=0.6:r=44100" \
  -af "highpass=f=180,lowpass=f=3200,afade=t=in:st=0:d=0.45:curve=qsin,afade=t=out:st=0.45:d=0.45:curve=qsin,volume=0.9" \
  "${enc[@]}" "$out/whoosh.mp3"

# نقرة مفتاح طرفية: نبضة قصيرة جدًا مرشّحة
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.04:c=white:a=0.9:r=44100" \
  -af "bandpass=f=2600:w=1800,afade=t=out:st=0:d=0.04:curve=exp,volume=0.8" \
  "${enc[@]}" "$out/click.mp3"

# ارتطام ناعم: جيب منخفض يخبو + لمسة ضجيج
ffmpeg -y -loglevel error -f lavfi \
  -i "aevalsrc=0.8*sin(2*PI*(58-18*t)*t)*exp(-3.2*t)+0.12*sin(2*PI*116*t)*exp(-5*t):d=1.4:s=44100" \
  -af "lowpass=f=900,afade=t=in:st=0:d=0.006,volume=0.9" \
  "${enc[@]}" "$out/impact.mp3"

# خلفية مستمرّة هادئة (pad): أوتار ثابتة بارتعاش بطيء — 48 ثانية
ffmpeg -y -loglevel error -f lavfi \
  -i "aevalsrc=(0.20*sin(2*PI*55*t)+0.13*sin(2*PI*82.41*t)+0.10*sin(2*PI*110*t)+0.05*sin(2*PI*164.81*t)+0.03*sin(2*PI*220.5*t))*(0.8+0.2*sin(2*PI*0.09*t)):d=48:s=44100" \
  -af "lowpass=f=1200,afade=t=in:st=0:d=3,afade=t=out:st=42:d=6,volume=0.8" \
  "${enc[@]}" "$out/pad.mp3"

ls -la "$out"
