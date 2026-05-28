import re

REGEX_PATTERNS = [
    (re.compile(r"\d{5,6}-\d{7}"), "주민등록번호"),
    (re.compile(r"0\d{1,2}[-\s]\d{3,4}[-\s]\d{4}"), "전화번호"),
    (re.compile(r"(19|20)\d{2}[.\-/]\d{2}[.\-/]\d{2}"), "생년월일"),
    (re.compile(r"[A-Z]{2}-\d{4}-\d{4}-\d{4}"), "처방번호"),
    (re.compile(r"\d{4}-\d{2}-\d{2}"), "날짜"),
    (re.compile(r"\d{3}-\d{4}"), "전화번호_단축"),
    (re.compile(r"☎\s*\d[\d\-]+"), "전화번호"),
]

COMMON_SENSITIVE_KEYWORDS = [
    "성명",
    "이름",
    "환자명",
    "수진자",
    "보호자명",
    "주민등록번호",
    "주민번호",
    "생년월일",
    "생년",
    "주소",
    "거주지",
    "생활주소",
    "주소지",
    "전화번호",
    "연락처",
    "처방전번호",
    "처방번호",
    "차트번호",
    "접수번호",
    "환자번호",
]

DOCUMENT_SENSITIVE_KEYWORDS = {
    "prescription": [
        "보호자명",
        "담당의",
        "담당의사",
        "의사명",
        "처방의",
        "면허번호",
        "의사면허번호",
        "의사면허",
        "서명",
        "날인",
        "인",
    ],
    "vaccination": [
        "접종자명",
        "피접종자",
        "보호자명",
        "담당의사",
        "의사명",
        "확인의사",
        "면허번호",
        "서명",
        "날인",
    ],
    "medical_certificate": [
        "의사",
        "의사명",
        "담당의",
        "담당의사",
        "주치의",
        "면허번호",
        "의사면허번호",
        "서명",
        "날인",
        "인",
    ],
    "unknown": [],
}

PATTERN_RRN = re.compile(r"\d{5,6}-\d{7}")
PATTERN_PHONE = re.compile(r"0\d{1,2}[-\s]\d{3,4}[-\s]\d{4}")
PATTERN_BIRTH = re.compile(r"(19|20)\d{2}[.\-/]\d{2}[.\-/]\d{2}")
PATTERN_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")
PATTERN_RX_NO = re.compile(r"[A-Z]{2}-\d{4}-\d{4}-\d{4}")


def get_sensitive_keywords(document_type: str) -> list[str]:
    return COMMON_SENSITIVE_KEYWORDS + DOCUMENT_SENSITIVE_KEYWORDS.get(document_type, [])
