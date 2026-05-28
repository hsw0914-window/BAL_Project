"""
OCR 단독 테스트 스크립트
사용법: python tests/ocr_test.py <이미지_경로>
예시:   python tests/ocr_test.py ../OCR/images/sample.png
"""
import sys
import os
import cv2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.image_service import load_image, correct_document, preprocess_for_ocr
from app.services.ocr_service import extract_text


def run(image_path: str):
    if not os.path.exists(image_path):
        print(f"[ERROR] 파일 없음: {image_path}")
        return

    print(f"[1] 이미지 로드: {image_path}")
    image = cv2.imread(image_path)

    print("[2] 문서 보정 중...")
    corrected = correct_document(image)

    print("[3] OCR 전처리 중...")
    preprocessed = preprocess_for_ocr(corrected)

    os.makedirs("output", exist_ok=True)
    cv2.imwrite("output/test_preprocessed.png", preprocessed)
    print("    전처리 이미지 저장: output/test_preprocessed.png")

    print("[4] OCR 텍스트 추출 중...")
    text = extract_text(preprocessed)

    print("\n===== 추출된 텍스트 =====")
    print(text if text else "(텍스트 없음)")
    print("========================\n")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "../OCR/images/sample.png"
    run(path)
