import re
from typing import Dict, List

from app.services.medicine_service import extract_medicines, extract_notes


def classify_document(text: str) -> str:
    normalized = re.sub(r"\s+", "", text).lower()

    score_map = {
        "prescription": 0,
        "vaccination": 0,
        "medical_certificate": 0,
    }

    for keyword in ["처방전", "약품", "약품명", "투약", "복용", "조제", "처방", "1일", "투약일수"]:
        if keyword in normalized:
            score_map["prescription"] += 1

    for keyword in ["예방접종", "접종", "접종일", "백신", "예진", "차수", "접종기관", "예방접종증명"]:
        if keyword in normalized:
            score_map["vaccination"] += 1

    for keyword in ["진료확인서", "진료", "진료일", "진료과", "내원", "의사", "병원장", "확인서"]:
        if keyword in normalized:
            score_map["medical_certificate"] += 1

    best_type = max(score_map, key=score_map.get)
    return best_type if score_map[best_type] > 0 else "unknown"


def extract_document_data(document_type: str, text: str) -> Dict:
    if document_type == "prescription":
        medicines = extract_medicines(text)
        notes = extract_notes(text)
        return {
            "summary": "약 정보와 복용 참고사항을 추출했습니다.",
            "medicines": medicines,
            "notes": notes,
        }

    if document_type == "vaccination":
        return {
            "summary": "예방접종 문서로 분류된 주요 항목입니다.",
            "institution_name": _find_first_value(text, ["접종기관", "의료기관명", "병원명", "기관명"]),
            "vaccines": _extract_vaccines(text),
            "vaccination_dates": _extract_dates_from_lines(text, ["접종일", "접종일자", "예방접종일"]),
        }

    if document_type == "medical_certificate":
        return {
            "summary": "진료확인서에서 확인 가능한 주요 항목입니다.",
            "hospital_name": _find_first_value(text, ["의료기관명", "병원명", "기관명"]),
            "department": _find_first_value(text, ["진료과", "진료과목", "진료부서"]),
            "visit_date": _find_first_date(text, ["진료일", "내원일", "방문일"]),
            "purpose": _find_first_value(text, ["용도", "제출처", "제출용"]),
        }

    return {
        "summary": "문서 유형을 확실히 분류하지 못했습니다.",
        "preview_lines": [line.strip() for line in text.splitlines() if line.strip()][:5],
    }


def _find_first_value(text: str, keywords: List[str]) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        for keyword in keywords:
            if keyword in stripped:
                parts = re.split(r"[:：]", stripped, maxsplit=1)
                return parts[1].strip() if len(parts) == 2 else stripped
    return ""


def _find_first_date(text: str, keywords: List[str]) -> str:
    pattern = re.compile(r"(20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2})")
    for line in text.splitlines():
        stripped = line.strip()
        if stripped and any(keyword in stripped for keyword in keywords):
            match = pattern.search(stripped)
            if match:
                return match.group(1)
    return ""


def _extract_dates_from_lines(text: str, keywords: List[str]) -> List[str]:
    pattern = re.compile(r"(20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2})")
    dates: List[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped and any(keyword in stripped for keyword in keywords):
            dates.extend(match.group(1) for match in pattern.finditer(stripped))
    return list(dict.fromkeys(dates))


def _extract_vaccines(text: str) -> List[Dict[str, str]]:
    vaccine_keywords = [
        "bcg", "b형간염", "dtap", "소아마비", "mmr", "수두", "일본뇌염",
        "폐렴구균", "독감", "인플루엔자", "로타", "a형간염", "hpv", "코로나",
    ]
    vaccines: List[Dict[str, str]] = []

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        lowered = stripped.lower()
        if any(keyword in lowered for keyword in vaccine_keywords) or "백신" in stripped:
            vaccines.append({
                "name": stripped,
                "date": _extract_inline_date(stripped),
            })

    unique: List[Dict[str, str]] = []
    seen = set()
    for item in vaccines:
        key = (item["name"], item["date"])
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


def _extract_inline_date(line: str) -> str:
    match = re.search(r"(20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2})", line)
    return match.group(1) if match else ""
