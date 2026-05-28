import cv2
import numpy as np


def load_image(file_bytes: bytes) -> np.ndarray | None:
    """업로드된 이미지 바이트가 유효한 이미지인지 검증용."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
