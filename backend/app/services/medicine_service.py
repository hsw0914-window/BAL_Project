import re
from typing import List, Dict


def extract_medicines(text: str) -> List[Dict]:
    """
    처방전 텍스트에서 약 정보를 추출.
    예: "이세토아미노펜시럽 80mg   5mL   3회   3일"
    """
    medicines = []
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue
        # 약 정보 줄 조건: mg 또는 mL 포함
        if not re.search(r'\d+\.?\d*\s*(mg|mL|ml)', line, re.IGNORECASE):
            continue
        # 처방내역 헤더 줄 제외
        if any(h in line for h in ["처방내역", "두어량", "두어횟수", "두어일수", "처방내억"]):
            continue

        # 공백/탭/파이프로 분리
        parts = [p.strip() for p in re.split(r'\s{2,}|\t|\|', line) if p.strip()]

        dose      = re.search(r'\d+\.?\d*\s*mL', line, re.IGNORECASE)
        frequency = re.search(r'\d+\s*회', line)
        duration  = re.search(r'\d+\s*일', line)
        name_m    = re.match(r'^([가-힣a-zA-Z\s]+(?:\d+mg)?)', line)

        medicines.append({
            "name":      name_m.group(1).strip() if name_m else parts[0] if parts else "",
            "dose":      dose.group().strip() if dose else (parts[1] if len(parts) > 1 else ""),
            "frequency": frequency.group().strip() if frequency else (parts[2] if len(parts) > 2 else ""),
            "duration":  duration.group().strip() if duration else (parts[3] if len(parts) > 3 else ""),
            "method":    "",
        })

    return medicines


def extract_notes(text: str) -> List[str]:
    """'조제 시 참고사항' 항목 추출"""
    notes = []
    lines = text.split("\n")
    in_notes = False

    for line in lines:
        stripped = line.strip()
        if any(k in stripped for k in ["참고사항", "창고사항", "주의사항", "복용방법"]):
            in_notes = True
            continue
        if in_notes:
            if stripped.startswith("-"):
                notes.append(stripped.lstrip("-").strip())
            elif stripped and not stripped.startswith("-"):
                in_notes = False

    return notes
