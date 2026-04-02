from app.services.ai_service import classify_category, mask_text, process_record


# ── 카테고리 분류 ─────────────────────────────────────────────
def test_classify_feeding():
    assert classify_category("분유 200ml 수유했어요") == "feeding"

def test_classify_sleep():
    assert classify_category("낮잠 2시간 잘 잤어요") == "sleep"

def test_classify_diaper():
    assert classify_category("기저귀 갈았어요 대변 있었음") == "diaper"

def test_classify_health():
    assert classify_category("병원 다녀왔어요 예방접종") == "health"

def test_classify_growth():
    assert classify_category("몸무게 7.2kg 측정") == "growth"

def test_classify_fallback():
    assert classify_category("오늘 날씨 좋다") == "memo"

def test_classify_empty():
    assert classify_category("") == "memo"


# ── 마스킹 ────────────────────────────────────────────────────
def test_mask_hospital():
    masked, items = mask_text("서울아동병원 다녀왔어요")
    assert "서울아동병원" not in masked
    assert any(i["info_type"] == "hospital" for i in items)

def test_mask_doctor():
    masked, items = mask_text("김철수 의사 선생님께 진료받았어요")
    assert any(i["info_type"] == "doctor" for i in items)

def test_mask_phone():
    masked, items = mask_text("010-1234-5678로 연락주세요")
    assert "010-1234-5678" not in masked
    assert any(i["info_type"] == "phone" for i in items)

def test_mask_no_sensitive_info():
    masked, items = mask_text("분유 200ml 먹었어요")
    assert masked == "분유 200ml 먹었어요"
    assert items == []

def test_mask_empty():
    masked, items = mask_text("")
    assert masked == ""
    assert items == []

def test_mask_preserves_original_value():
    _, items = mask_text("서울아동병원 다녀왔어요")
    hospital_item = next(i for i in items if i["info_type"] == "hospital")
    assert hospital_item["original_value"] == "서울아동병원"


# ── 통합 처리 ─────────────────────────────────────────────────
def test_process_record_auto_category():
    result = process_record("분유 150ml 수유")
    assert result["category"] == "feeding"

def test_process_record_manual_category():
    result = process_record("분유 150ml 수유", category="memo")
    assert result["category"] == "memo"  # 수동 지정 우선

def test_process_record_includes_masked_info():
    result = process_record("서울아동병원 김철수 의사 진료")
    assert len(result["masked_info"]) >= 1
