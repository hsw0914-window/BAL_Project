import cv2
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

image = cv2.imread("output/scanned_bw.png")

if image is None:
    raise FileNotFoundError("images/sample.png 파일을 찾을 수 없습니다.")

# 크기 확대
image = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

# 그레이스케일
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# 노이즈 제거
gray = cv2.GaussianBlur(gray, (3, 3), 0)

# 이진화
thresh = cv2.adaptiveThreshold(
    gray, 255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY, 31, 15
)

# OCR
config = r'--oem 3 --psm 6'
text = pytesseract.image_to_string(thresh, lang="kor+eng", config=config)

print("추출된 텍스트:")
print(text)