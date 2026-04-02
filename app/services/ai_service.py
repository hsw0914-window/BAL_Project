"""
AI 분류 및 마스킹 서비스
현재는 규칙 기반 더미 로직 → 추후 Claude/OpenAI API로 교체 가능한 구조
"""
import re
from typing import Tuple, List, Dict


# ── 카테고리 키워드 맵 ─────────────────────────────────────────
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "feeding":  ["수유", "분유", "모유", "이유식", "먹", "밥", "음식", "ml", "cc"],
    "sleep":    ["수면", "낮잠", "잠", "취침", "기상", "잤", "졸"],
    "diaper":   ["기저귀", "대변", "소변", "응가", "오줌", "변"],
    "health":   ["병원", "진료", "약", "열", "체온", "예방접종", "백신", "의사"],
    "growth":   ["몸무게", "키", "체중", "성장", "발달", "cm", "kg"],
    "memo":     [],  # fallback
}

# ── 마스킹 패턴 ───────────────────────────────────────────────
MASK_PATTERNS = [
    # 병원명: XX병원, XX의원, XX클리닉
    (r"[가-힣a-zA-Z0-9]+(?:병원|의원|클리닉|센터)", "hospital", "**병원"),
    # 의사명: 홍길동 의사/선생님
    (r"[가-힣]{2,4}\s*(?:의사|선생님|원장|간호사)", "doctor", "**의사"),
    # 전화번호
    (r"0\d{1,2}-\d{3,4}-\d{4}", "phone", "***-****-****"),
    # 주소
    (r"[가-힣]+(?:시|도)\s+[가-힣]+(?:구|군)\s+[가-힣]+(?:동|로|길)", "address", "**주소"),
]


def classify_category(text: str) -> str:
    """텍스트에서 카테고리를 자동 분류"""
    if not text:
        return "memo"

    text_lower = text.lower()
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}

    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[category] += 1

    best = max(scores, key=lambda c: scores[c])
    return best if scores[best] > 0 else "memo"


def mask_text(text: str) -> Tuple[str, List[Dict]]:
    """
    텍스트 마스킹 처리
    Returns:
        masked_text: 마스킹된 텍스트
        masked_items: [{"info_type": ..., "original_value": ..., "masked_value": ...}]
    """
    if not text:
        return text, []

    masked_text = text
    masked_items = []

    for pattern, info_type, replacement in MASK_PATTERNS:
        matches = re.findall(pattern, masked_text)
        for match in matches:
            masked_text = masked_text.replace(match, replacement, 1)
            masked_items.append({
                "info_type": info_type,
                "original_value": match,
                "masked_value": replacement,
            })

    return masked_text, masked_items


def process_record(text: str, category: str = None) -> Dict:
    """
    기록 텍스트 전처리 (분류 + 마스킹 통합)
    category가 None이면 자동 분류
    """
    resolved_category = category if category else classify_category(text)
    masked_text, masked_items = mask_text(text)

    return {
        "category": resolved_category,
        "masked_text": masked_text,
        "masked_info": masked_items,
    }
