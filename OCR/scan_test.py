import cv2
import numpy as np
import os


def order_points(pts):
    # 좌상, 우상, 우하, 좌하 순서로 정렬
    rect = np.zeros((4, 2), dtype="float32")

    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left
    rect[2] = pts[np.argmax(s)]  # bottom-right

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left

    return rect


def four_point_transform(image, pts):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = max(int(width_a), int(width_b))

    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = max(int(height_a), int(height_b))

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (max_width, max_height))

    return warped


# 원본 이미지 경로
image_path = "images/sample.png"
image = cv2.imread(image_path)

if image is None:
    raise FileNotFoundError(f"{image_path} 파일을 찾을 수 없습니다.")

orig = image.copy()

# 크기 축소해서 윤곽 검출 안정화
ratio = image.shape[0] / 1000.0
resized = cv2.resize(image, (int(image.shape[1] / ratio), 1000))

# 전처리
gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
edged = cv2.Canny(blurred, 75, 200)

# 윤곽선 찾기
contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

doc_cnt = None

for c in contours:
    peri = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, 0.02 * peri, True)

    if len(approx) == 4:
        doc_cnt = approx
        break

if doc_cnt is None:
    raise ValueError("문서 외곽을 찾지 못했습니다. 사진이 너무 복잡하거나 문서 경계가 불명확할 수 있습니다.")

# 원본 크기 기준으로 좌표 복원
doc_cnt = doc_cnt.reshape(4, 2) * ratio

# 원근 보정
warped = four_point_transform(orig, doc_cnt)

# 스캔본 느낌으로 후처리
warped_gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
warped_thresh = cv2.adaptiveThreshold(
    warped_gray,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    21,
    10
)

# 저장 폴더
os.makedirs("output", exist_ok=True)

cv2.imwrite("output/scanned_color.png", warped)
cv2.imwrite("output/scanned_bw.png", warped_thresh)

print("문서 보정 완료")
print("저장 파일:")
print("- output/scanned_color.png")
print("- output/scanned_bw.png")