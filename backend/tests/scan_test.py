"""
이미지 전처리(문서 보정) 단독 테스트
사용법: python tests/scan_test.py <이미지_경로>
예시:   python tests/scan_test.py ../OCR/images/sample.png
"""
import sys
import os
import cv2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.image_service import correct_document


def run(image_path: str):
    if not os.path.exists(image_path):
        print(f"[ERROR] 파일 없음: {image_path}")
        return

    print(f"[1] 이미지 로드: {image_path}")
    image = cv2.imread(image_path)

    print("[2] 문서 보정 중...")
    corrected = correct_document(image)

    os.makedirs("output", exist_ok=True)
    out_path = "output/test_corrected.png"
    cv2.imwrite(out_path, corrected)
    print(f"[3] 보정 이미지 저장: {out_path}")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "../OCR/images/sample.png"
    run(path)
