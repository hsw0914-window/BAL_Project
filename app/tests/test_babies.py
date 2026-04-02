def test_create_baby(client, auth_headers):
    res = client.post("/api/v1/babies", json={
        "name": "하은",
        "birth_date": "2023-11-01",
        "gender": "female",
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "하은"
    assert data["gender"] == "female"


def test_list_babies(client, auth_headers, baby):
    res = client.get("/api/v1/babies", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_baby(client, auth_headers, baby):
    res = client.get(f"/api/v1/babies/{baby['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "민준"


def test_get_baby_not_found(client, auth_headers):
    res = client.get("/api/v1/babies/9999", headers=auth_headers)
    assert res.status_code == 404


def test_update_baby(client, auth_headers, baby):
    res = client.patch(f"/api/v1/babies/{baby['id']}", json={
        "name": "민준이",
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "민준이"


def test_delete_baby(client, auth_headers, baby):
    res = client.delete(f"/api/v1/babies/{baby['id']}", headers=auth_headers)
    assert res.status_code == 204

    # 삭제 후 조회 시 404
    res = client.get(f"/api/v1/babies/{baby['id']}", headers=auth_headers)
    assert res.status_code == 404


def test_cannot_access_other_user_baby(client, baby):
    # 다른 사용자로 회원가입
    other = client.post("/api/v1/auth/register", json={
        "email": "other@example.com",
        "password": "password123",
        "nickname": "타인",
    })
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    res = client.get(f"/api/v1/babies/{baby['id']}", headers=other_headers)
    assert res.status_code == 404
