def _create_record(client, auth_headers, baby_id, category, record_date):
    client.post("/api/v1/records", json={
        "baby_id": baby_id,
        "category": category,
        "original_text": f"{category} 기록",
        "record_date": record_date,
    }, headers=auth_headers)


def test_report_basic(client, auth_headers, baby):
    baby_id = baby["id"]
    _create_record(client, auth_headers, baby_id, "feeding", "2025-01-10T10:00:00")
    _create_record(client, auth_headers, baby_id, "feeding", "2025-01-11T10:00:00")
    _create_record(client, auth_headers, baby_id, "sleep",   "2025-01-10T14:00:00")

    res = client.get(
        f"/api/v1/reports/{baby_id}",
        params={
            "start_date": "2025-01-01T00:00:00",
            "end_date": "2025-01-31T23:59:59",
        },
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 3
    cats = {c["category"]: c["count"] for c in data["by_category"]}
    assert cats["feeding"] == 2
    assert cats["sleep"] == 1


def test_report_empty_period(client, auth_headers, baby):
    baby_id = baby["id"]
    _create_record(client, auth_headers, baby_id, "feeding", "2025-01-10T10:00:00")

    res = client.get(
        f"/api/v1/reports/{baby_id}",
        params={
            "start_date": "2025-02-01T00:00:00",
            "end_date": "2025-02-28T23:59:59",
        },
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["total_count"] == 0


def test_report_invalid_date_range(client, auth_headers, baby):
    res = client.get(
        f"/api/v1/reports/{baby['id']}",
        params={
            "start_date": "2025-02-01T00:00:00",
            "end_date": "2025-01-01T00:00:00",  # 종료일 < 시작일
        },
        headers=auth_headers,
    )
    assert res.status_code == 400


def test_report_other_user_baby(client, baby, auth_headers):
    other = client.post("/api/v1/auth/register", json={
        "email": "other@example.com",
        "password": "password123",
        "nickname": "타인",
    })
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    res = client.get(
        f"/api/v1/reports/{baby['id']}",
        params={
            "start_date": "2025-01-01T00:00:00",
            "end_date": "2025-01-31T23:59:59",
        },
        headers=other_headers,
    )
    assert res.status_code == 404


def test_report_records_ordered_by_date(client, auth_headers, baby):
    baby_id = baby["id"]
    _create_record(client, auth_headers, baby_id, "sleep",   "2025-01-15T10:00:00")
    _create_record(client, auth_headers, baby_id, "feeding", "2025-01-10T08:00:00")
    _create_record(client, auth_headers, baby_id, "diaper",  "2025-01-12T09:00:00")

    res = client.get(
        f"/api/v1/reports/{baby_id}",
        params={
            "start_date": "2025-01-01T00:00:00",
            "end_date": "2025-01-31T23:59:59",
        },
        headers=auth_headers,
    )
    records = res.json()["records"]
    dates = [r["record_date"] for r in records]
    assert dates == sorted(dates)  # 오름차순 정렬 확인
