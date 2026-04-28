import json
import os
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

CATEGORIES = [
    "모유기록",
    "분유기록",
    "이유식기록",
    "기저귀기록",
    "수면기록",
    "성장기록",
    "발달기록",
    "건강기록",
    "병원기록",
    "일상기록",
]

SYSTEM_PROMPT = """당신은 육아 기록을 분류하고 구조화된 데이터로 추출하는 전문가입니다.
사용자가 입력한 텍스트에서 해당하는 모든 카테고리를 찾아 각각 구조화된 JSON으로 반환하세요.

카테고리별 추출 필드:

- 모유기록: duration_min (수유 시간, 정수, 분 단위. 모르면 null)
- 분유기록: amount_ml (수유량, 정수, ml 단위. 모르면 null)
- 이유식기록: food_name (음식명, 문자열), amount_g (섭취량, 정수, g 단위. 모르면 null), reaction (반응: "잘 먹음" | "보통" | "거부" | null)
- 기저귀기록: type (종류: "소변" | "대변" | "소변+대변")
- 수면기록: sleep_type ("낮잠" | "야간수면"), duration_min (수면 시간, 정수, 분 단위. 모르면 null)
- 성장기록: height_cm (키, 실수. 모르면 null), weight_kg (몸무게, 실수. 모르면 null), head_cm (두위, 실수. 모르면 null)
- 발달기록: milestone (이정표 설명, 문자열)
- 건강기록: temperature (체온, 실수, ℃. 모르면 null), medicine (약 이름 및 용량, 문자열. 없으면 null), symptom (증상, 문자열. 없으면 null)
- 병원기록: hospital_name (병원명. 모르면 null), purpose (방문 목적, 문자열), prescription (처방 내용. 없으면 null)
- 일상기록: memo (메모 내용, 문자열)

공통 필드 (모든 카테고리):
- category: 카테고리명
- summary: 핵심 한 줄 요약 (30자 이내)

규칙:
- 해당하는 카테고리를 모두 추출하세요
- 중복 카테고리는 하나로 합치세요
- 값을 알 수 없으면 반드시 null로 설정하세요 (빈 문자열 금지)
- 다른 카테고리 내용이 섞이지 않도록 하세요

반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

예시:
[
  {"category": "분유기록", "summary": "오전 분유 180ml", "amount_ml": 180},
  {"category": "수면기록", "summary": "낮잠 2시간", "sleep_type": "낮잠", "duration_min": 120},
  {"category": "건강기록", "summary": "체온 38.2도 타이레놀 복용", "temperature": 38.2, "medicine": "타이레놀 시럽 5ml", "symptom": "발열"}
]"""


async def classify_record(text: str) -> list:
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    results = json.loads(raw)

    valid_results = [r for r in results if r.get("category") in CATEGORIES]

    if not valid_results:
        valid_results = [{"category": "일상기록", "summary": text[:30], "memo": text[:80]}]

    return valid_results
