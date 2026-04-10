from app.models.user import User
from app.core.security import hash_password


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_login_success(client, db):
    user = User(name="Staff", email="staff@vision.iq", password_hash=hash_password("pass123"))
    db.add(user)
    db.commit()
    resp = client.post("/auth/login", json={"email": "staff@vision.iq", "password": "pass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client, db):
    user = User(name="Staff2", email="staff2@vision.iq", password_hash=hash_password("correct"))
    db.add(user)
    db.commit()
    resp = client.post("/auth/login", json={"email": "staff2@vision.iq", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_user(client):
    resp = client.post("/auth/login", json={"email": "nobody@vision.iq", "password": "x"})
    assert resp.status_code == 401
