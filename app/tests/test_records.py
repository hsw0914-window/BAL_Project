from datetime import datetime


RECORD_PAYLOAD = {
    "category": "feeding",
    "original_text": "오전 10시 서울아동병원 김철수 의사 진료 후 분유 200ml 수유",
    "record_date": "2025-01-10T10:30:00",
}


def _create_record(client, auth_headers, baby, payload=None):
    body = {**RECORD_PAYLOAD, "baby_id": baby["id"]}
    if payload:
        body.update(payload)
    return client.post("/api/v1/records", json=body, headers=auth_headers)


def test_create_record(client, auth_headers, baby):
    res = _create_record(client, auth_headers, baby)
    assert res.status_code == 201
    data = res.json()
    assert data["category"] == "feeding"
    assert data["baby_id"] == baby["id"]
    # 마스킹 처리 확인
    assert data["masked_text"] is not None
    assert "masked_info" in data


def test_create_record_auto_category(client, auth_headers, baby):
    """category 없이도 AI 자동 분류 동작 확인"""
    res = client.post("/api/v1/records", json={
        "baby_id": baby["id"],
        "category": "sleep",           # AI 분류 검증: sleep 키워드 텍스트
        "original_text": "낮잠 2시간 잘 잤어요",
        "record_date": "2025-01-10T13:00:00",
    }, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["category"] == "sleep"


def test_list_records(client, auth_headers, baby):
    _create_record(client, auth_headers, baby)
    _create_record(client, auth_headers, baby, {"record_date": "2025-01-11T10:00:00"})

    res = client.get("/api/v1/records", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_list_records_filter_category(client, auth_headers, baby):
    _create_record(client, auth_headers, baby, {"category": "feeding"})
    _create_record(client, auth_headers, baby, {
        "category": "sleep",
        "original_text": "낮잠",
        "record_date": "2025-01-11T10:00:00"
    })

    res = client.get("/api/v1/records?category=feeding", headers=auth_headers)
    assert res.status_code == 200
    assert all(r["category"] == "feeding" for r in res.json())


def test_list_records_filter_date(client, auth_headers, baby):
    _create_record(client, auth_headers, baby, {"record_date": "2025-01-10T10:00:00"})
    _create_record(client, auth_headers, baby, {"record_date": "2025-02-10T10:00:00"})

    res = client.get(
        "/api/v1/records?start_date=2025-01-01T00:00:00&end_date=2025-01-31T23:59:59",
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_record(client, auth_headers, baby):
    created = _create_record(client, auth_headers, baby).json()
    res = client.get(f"/api/v1/records/{created['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


def test_update_record(client, auth_headers, baby):
    created = _create_record(client, auth_headers, baby).json()
    res = client.patch(f"/api/v1/records/{created['id']}", json={
        "original_text": "기저귀 갈았어요 대변 있음",
        "category": "diaper",        # 명시적 카테고리 지정
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["category"] == "diaper"


def test_delete_record(client, auth_headers, baby):
    created = _create_record(client, auth_headers, baby).json()
    res = client.delete(f"/api/v1/records/{created['id']}", headers=auth_headers)
    assert res.status_code == 204

    res = client.get(f"/api/v1/records/{created['id']}", headers=auth_headers)
    assert res.status_code == 404


def test_masked_info_saved(client, auth_headers, baby):
    """병원명, 의사명 마스킹 정보 저장 확인"""
    res = _create_record(client, auth_headers, baby)
    data = res.json()
    assert len(data["masked_info"]) >= 1
    types = [m["info_type"] for m in data["masked_info"]]
    assert "hospital" in types or "doctor" in types
