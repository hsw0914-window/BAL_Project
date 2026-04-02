def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "id": "new@example.com",
        "password": "password123",
        "nickname": "신규유저",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "new@example.com"


def test_register_duplicate_email(client, registered_user):
    res = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "nickname": "중복유저",
    })
    assert res.status_code == 400


def test_register_short_password(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "short@example.com",
        "password": "1234",
        "nickname": "짧은비번",
    })
    assert res.status_code == 422


def test_login_success(client, registered_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client, registered_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_get_me(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


def test_get_me_no_token(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 403


def test_refresh_token(client, registered_user):
    res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": registered_user["refresh_token"],
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
