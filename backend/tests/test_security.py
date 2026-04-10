from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hash_and_verify():
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)

def test_create_and_decode_token():
    token = create_access_token({"sub": "user@example.com"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user@example.com"

def test_invalid_token_returns_none():
    assert decode_access_token("not-a-real-token") is None
