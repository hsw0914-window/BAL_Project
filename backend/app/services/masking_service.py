import re
from typing import Dict, List, Tuple

import cv2
import numpy as np

from app.utils.regex_patterns import (
    PATTERN_BIRTH,
    PATTERN_DATE,
    PATTERN_PHONE,
    PATTERN_RRN,
    PATTERN_RX_NO,
    REGEX_PATTERNS,
    get_sensitive_keywords,
)

Box = Tuple[int, int, int, int]


def _group_into_lines(words: List[dict], y_tol: int = 12) -> List[List[dict]]:
    if not words:
        return []

    sorted_words = sorted(words, key=lambda word: (word["box"]["y1"], word["box"]["x1"]))
    lines: List[List[dict]] = [[sorted_words[0]]]

    for word in sorted_words[1:]:
        current_line = lines[-1]
        current_y = current_line[0]["box"]["y1"]
        if abs(word["box"]["y1"] - current_y) <= y_tol:
            current_line.append(word)
        else:
            lines.append([word])

    return lines


def _box_from_word(word: dict) -> Box:
    box = word["box"]
    return box["x1"], box["y1"], box["x2"], box["y2"]


def _merge_boxes(boxes: List[Box]) -> Box:
    return (
        min(box[0] for box in boxes),
        min(box[1] for box in boxes),
        max(box[2] for box in boxes),
        max(box[3] for box in boxes),
    )


def _word_matches_keyword(word_text: str, keyword: str) -> bool:
    stripped = word_text.strip()
    return (
        stripped == keyword
        or stripped.startswith(f"{keyword}:")
        or stripped.startswith(f"{keyword}：")
    )


def _find_keyword_index(line: List[dict], keyword: str) -> int | None:
    for idx, word in enumerate(line):
        if _word_matches_keyword(word["text"], keyword):
            return idx
    return None


def _line_contains_sensitive_keyword(line: List[dict], keyword: str) -> bool:
    return _find_keyword_index(line, keyword) is not None


def detect_sensitive_boxes(words: List[dict], document_type: str = "unknown") -> Tuple[List[Box], List[Dict]]:
    boxes: List[Box] = []
    detected: List[Dict] = []
    seen_types = set()
    sensitive_keywords = get_sensitive_keywords(document_type)

    for line in _group_into_lines(words):
        line_text = " ".join(word["text"] for word in line).strip()

        for keyword in sensitive_keywords:
            if not _line_contains_sensitive_keyword(line, keyword):
                continue

            keyword_index = _find_keyword_index(line, keyword)
            if keyword_index is None:
                continue

            value_boxes = [_box_from_word(word) for word in line[keyword_index + 1 :]]
            if value_boxes:
                boxes.append(_merge_boxes(value_boxes))
                if keyword not in seen_types:
                    detected.append({"type": keyword, "original": line_text})
                    seen_types.add(keyword)
            break

        for word in line:
            for pattern, pattern_type in REGEX_PATTERNS:
                if pattern.search(word["text"]):
                    boxes.append(_box_from_word(word))
                    if pattern_type not in seen_types:
                        detected.append({"type": pattern_type, "original": word["text"]})
                        seen_types.add(pattern_type)

    return boxes, detected


def apply_image_mask(image_bytes: bytes, boxes: List[Box], padding: int = 4) -> bytes:
    array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)

    for x1, y1, x2, y2 in boxes:
        px1 = max(0, x1 - padding)
        py1 = max(0, y1 - padding)
        px2 = min(image.shape[1], x2 + padding)
        py2 = min(image.shape[0], y2 + padding)
        cv2.rectangle(image, (px1, py1), (px2, py2), (0, 0, 0), -1)

    _, encoded = cv2.imencode(".png", image)
    return encoded.tobytes()


def _line_starts_with_sensitive_keyword(line: str, keyword: str) -> bool:
    stripped = line.strip()
    return (
        stripped == keyword
        or stripped.startswith(f"{keyword}:")
        or stripped.startswith(f"{keyword}：")
        or stripped.startswith(f"{keyword} ")
    )


def _mask_keyword_line(line: str, sensitive_keywords: List[str]) -> str:
    for keyword in sensitive_keywords:
        if _line_starts_with_sensitive_keyword(line, keyword):
            return re.sub(r"([:：]\s*)(.+)", r"\1***", line)
    return line


def mask_text(text: str, document_type: str = "unknown") -> str:
    sensitive_keywords = get_sensitive_keywords(document_type)
    result = []

    for line in text.split("\n"):
        line = PATTERN_RRN.sub("******-*******", line)
        line = PATTERN_PHONE.sub("***-****-****", line)
        line = PATTERN_BIRTH.sub("****-**-**", line)
        line = PATTERN_DATE.sub("****-**-**", line)
        line = PATTERN_RX_NO.sub("[처방번호 마스킹]", line)
        line = _mask_keyword_line(line, sensitive_keywords)
        result.append(line)

    return "\n".join(result)
