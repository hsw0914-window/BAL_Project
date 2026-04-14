import os
import uuid
import cv2
import numpy as np


def ensure_dirs(*dirs: str):
    for d in dirs:
        os.makedirs(d, exist_ok=True)


def save_image(image: np.ndarray, directory: str, prefix: str = "img") -> str:
    """이미지를 directory에 저장하고 파일 경로 반환"""
    ensure_dirs(directory)
    filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
    path = os.path.join(directory, filename)
    cv2.imwrite(path, image)
    return path


def save_text(text: str, directory: str, prefix: str = "ocr") -> str:
    """텍스트를 .txt 파일로 저장하고 경로 반환"""
    ensure_dirs(directory)
    filename = f"{prefix}_{uuid.uuid4().hex[:8]}.txt"
    path = os.path.join(directory, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path
