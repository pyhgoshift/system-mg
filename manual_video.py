"""Render a narrated Korean product manual for PyhgoShift LiveShow Dashboard."""
from __future__ import annotations

import asyncio
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import edge_tts


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output" / "video_manual"
W, H = 1920, 1080
FONT = Path("C:/Windows/Fonts/malgun.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/malgunbd.ttf")
VOICE = "ko-KR-InJoonNeural"

SCENES = [
    ("PyhgoShift LiveShow", "서버 이전을 한 화면에서", ["실시간 진행 현황", "작업 단계별 상태", "최종 전환 검증"],
     "PyhgoShift LiveShow Dashboard는 서버 이전과 서비스 전환 작업을 실시간으로 관리하는 운영 대시보드입니다. 복잡한 작업 현황을 한 화면에서 명확하게 확인할 수 있습니다."),
    ("AS-IS → TO-BE", "기존 환경과 전환 환경을 동시에 확인", ["좌측: 기존 서버와 작업 상태", "중앙: 진행 중 데이터 흐름", "우측: 전환 대상 환경"],
     "대시보드는 기존 환경과 전환 환경을 나란히 보여 줍니다. 진행 중인 작업은 중앙의 흐름으로 표현되어, 어떤 단계가 이동 중인지 쉽게 파악할 수 있습니다."),
    ("6단계 전환 관리", "작업 흐름을 단계별로 통제", ["개시 · vMotion · 서비스 전환", "DNS 전환 · 사용자 검증 · 종료", "완료 · 진행 · 대기 상태 자동 집계"],
     "작업은 여섯 단계로 관리됩니다. 각 단계의 진행률과 완료, 진행, 대기 건수가 자동 집계되어 운영자는 병목 구간을 빠르게 찾을 수 있습니다."),
    ("Google Sheets 연동", "작업 시트가 대시보드의 데이터 원본", ["Apps Script 웹 앱으로 JSON 제공", "웹 앱 주소를 설정 영역에 입력", "5초 단위 자동 동기화"],
     "작업 데이터는 Google Sheets에서 관리합니다. Apps Script 웹 앱 주소를 설정하면, 대시보드는 5초마다 데이터를 읽어 최신 상태를 반영합니다."),
    ("실시간 상태 확인", "업데이트는 화면에 즉시 반영", ["done: 완료", "progress: 진행 중", "wait: 대기", "진행 작업은 별도 시각 효과로 강조"],
     "시트에서 상태와 진행률을 업데이트하면 완료, 진행, 대기 상태가 대시보드에 반영됩니다. 진행 중인 작업은 별도의 강조 효과로 확인할 수 있습니다."),
    ("DNS · URL 검증", "전환 후 서비스 정상 동작 확인", ["DNS 완료 후 URL 검증 활성화", "등록된 서비스 주소 순서대로 확인", "검증 결과를 최종 완료 조건에 반영"],
     "DNS 전환이 완료되면 서비스 URL 검증 단계가 열립니다. 운영자는 등록된 주소를 순서대로 확인해, 전환 후 서비스가 정상 동작하는지 검수합니다."),
    ("MIGRATION COMPLETED", "완료 확인과 운영 마무리", ["전체 진행률 100%", "완료 알림과 축하 효과", "새 프로젝트도 동일한 흐름으로 등록"],
     "모든 검증이 끝나면 대시보드는 전환 완료 상태를 표시합니다. 새 프로젝트도 동일한 시트 구조와 Apps Script 연결만 준비하면 같은 방식으로 운영할 수 있습니다."),
]


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def frame(index: int, heading: str, subheading: str, bullets: list[str], destination: Path) -> None:
    image = Image.new("RGB", (W, H), "#07111f")
    draw = ImageDraw.Draw(image)
    # Soft blue/teal background fields.
    for radius, color, x, y in [(500, "#0a3146", 1540, 120), (620, "#112a4a", 200, 950), (360, "#123d3b", 1400, 880)]:
        draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)
    draw.rectangle((0, 0, W, 108), fill="#09192c")
    draw.text((82, 34), "PYHGOSHIFT  |  LIVESHOW DASHBOARD", font=font(30, True), fill="#86eaff")
    draw.text((W-280, 37), f"MANUAL  {index+1:02d}/07", font=font(24, True), fill="#78f2bf")
    draw.text((112, 190), heading, font=font(76, True), fill="white")
    draw.text((116, 290), subheading, font=font(35), fill="#a5c5da")
    # Main information panel.
    rounded(draw, (112, 390, 1180, 860), 36, "#0c1c31", "#28516d", 2)
    for n, item in enumerate(bullets):
        y = 470 + n * 112
        draw.ellipse((170, y, 204, y+34), fill="#28d6c7")
        draw.text((235, y-7), item, font=font(37, True), fill="#ecf8ff")
    # Right visual: six-stage pipeline and monitor card.
    rounded(draw, (1270, 225, 1780, 840), 40, "#0c2032", "#2f6d8a", 2)
    draw.text((1330, 285), "LIVE MONITORING", font=font(27, True), fill="#68f0bd")
    stage_names = ["개시", "vMotion", "서비스", "DNS", "검증", "종료"]
    for n, name in enumerate(stage_names):
        y = 355 + n * 68
        color = "#34d399" if n < index else "#50bce7" if n == index else "#29475f"
        draw.ellipse((1335, y, 1364, y+29), fill=color)
        draw.text((1395, y-5), name, font=font(27, True), fill="#d8efff")
        draw.rounded_rectangle((1545, y+3, 1710, y+24), 9, fill="#18324b")
        draw.rounded_rectangle((1545, y+3, 1545 + min(165, 35+n*22), y+24), 9, fill=color)
    draw.text((1325, 748), "GOOGLE SHEETS  →  APPS SCRIPT", font=font(19, True), fill="#78b9df")
    draw.text((1325, 780), "5초 자동 동기화", font=font(25, True), fill="#ffffff")
    # Bottom timeline
    draw.line((112, 955, 1808, 955), fill="#264864", width=8)
    for n in range(7):
        x = 112 + n * 282
        draw.ellipse((x-13, 942, x+13, 968), fill="#3cf0c0" if n <= index else "#31536b")
    draw.text((112, 995), "PYHGOSHIFT · 운영 전환을 더 명확하게", font=font(25), fill="#7fa7bf")
    image.save(destination)


async def tts(text: str, output: Path) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate="-12%", pitch="-5Hz")
    await communicate.save(str(output))


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


async def main() -> None:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is not available in PATH")
    OUT.mkdir(parents=True, exist_ok=True)
    segments = []
    for index, (heading, subheading, bullets, narration) in enumerate(SCENES):
        png = OUT / f"scene_{index+1:02d}.png"
        mp3 = OUT / f"scene_{index+1:02d}.mp3"
        mp4 = OUT / f"scene_{index+1:02d}.mp4"
        frame(index, heading, subheading, bullets, png)
        await tts(narration, mp3)
        run(["ffmpeg", "-y", "-loop", "1", "-i", str(png), "-i", str(mp3), "-c:v", "libx264", "-tune", "stillimage", "-r", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", str(mp4)])
        segments.append(mp4)
    concat = OUT / "concat.txt"
    concat.write_text("\n".join(f"file '{p.as_posix()}'" for p in segments), encoding="utf-8")
    final = OUT / "PyhgoShift_LiveShow_Manual_ko.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", "-movflags", "+faststart", str(final)])
    print(final)


if __name__ == "__main__":
    asyncio.run(main())
