"""
민감정보 마스킹 단독 테스트 (텍스트 기반, 이미지 불필요)
사용법: python tests/mask_test.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.masking_service import detect_and_mask

SAMPLE_TEXT = """
서울중앙병원 처방전

성명: 김철수
주민등록번호: 850123-1234567
생년월일: 1985-01-23
주소: 서울특별시 서초구 반포대로 55, 101동 502호
전화번호: 010-1234-5678
진료과: 내과
담당의: 이영희
"""


def run():
    print("===== 원본 텍스트 =====")
    print(SAMPLE_TEXT)

    result = detect_and_mask(SAMPLE_TEXT)

    print("===== 마스킹 결과 =====")
    print(result["masked_text"])

    print("\n===== 탐지된 민감정보 =====")
    for item in result["detected"]:
        print(f"  [{item['type']}] {item['original']}")

    print(f"\n총 {len(result['detected'])}건 탐지됨")


if __name__ == "__main__":
    run()
