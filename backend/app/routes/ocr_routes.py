import os
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.response_model import DetectedItem, MedicineItem, ProcessResponse
from app.services.document_service import classify_document, extract_document_data
from app.services.image_service import load_image
from app.services.masking_service import apply_image_mask, detect_sensitive_boxes, mask_text
from app.services.medicine_service import extract_medicines, extract_notes
from app.services.ocr_service import extract_ocr_result

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/bmp", "image/tiff"}


@router.post("/upload", response_model=ProcessResponse)
async def upload_and_process(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식: {file.content_type}")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="빈 파일입니다.")

    if load_image(file_bytes) is None:
        raise HTTPException(status_code=422, detail="이미지를 읽을 수 없습니다.")

    ocr_result = await extract_ocr_result(file_bytes, file.filename or "document.png")
    original_text = ocr_result["text"]
    words = ocr_result["words"]

    if not original_text:
        raise HTTPException(status_code=422, detail="텍스트를 추출하지 못했습니다. 이미지 상태를 확인해주세요.")

    document_type = classify_document(original_text)
    boxes, detected_raw = detect_sensitive_boxes(words, document_type=document_type)
    masked_image_bytes = apply_image_mask(file_bytes, boxes)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    image_filename = f"masked_{uuid.uuid4().hex[:8]}.png"
    image_path = os.path.join(OUTPUT_DIR, image_filename)
    with open(image_path, "wb") as f:
        f.write(masked_image_bytes)

    del file_bytes
    del masked_image_bytes

    masked_text = mask_text(original_text, document_type=document_type)
    extracted = extract_document_data(document_type, original_text)

    medicines = extract_medicines(original_text) if document_type == "prescription" else []
    notes = extract_notes(original_text) if document_type == "prescription" else []

    return ProcessResponse(
        status="success",
        document_type=document_type,
        masked_text=masked_text,
        detected=[DetectedItem(**d) for d in detected_raw],
        medicines=[MedicineItem(**m) for m in medicines],
        notes=notes,
        extracted=extracted,
        masked_image_url=f"/output/{image_filename}",
    )


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "OCR + Image Masking (Upstage)"}
