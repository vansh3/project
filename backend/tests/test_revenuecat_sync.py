"""Tests for new session features: admin identity (Richa Madan), and
POST /api/payments/revenuecat/sync endpoint that mirrors RevenueCat
entitlement onto the existing users.premium field."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path("/app/frontend/.env"))
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")

load_dotenv(Path("/app/backend/.env"))
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="module")
def user_token(api):
    email = f"TEST_rc_{uuid.uuid4().hex[:8]}@example.com"
    r = api.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": "Pass@1234", "name": "RC Test"})
    assert r.status_code == 200
    return r.json()


class TestAdminIdentity:
    def test_admin_name_is_richa_madan(self, admin_token):
        user = admin_token["user"]
        assert user["name"] == "Richa Madan"
        assert user["role"] == "admin"
        assert user["premium"] is True

    def test_server_py_has_no_hardcoded_admin_literals(self):
        src = Path("/app/backend/server.py").read_text()
        assert "admin@emoticoach.app" not in src
        assert "Admin@123" not in src


class TestRevenueCatSync:
    def test_sync_requires_auth(self, api):
        r = api.post(f"{BASE_URL}/api/payments/revenuecat/sync", json={"active": True})
        assert r.status_code == 401

    def test_sync_active_true_sets_premium(self, api, user_token):
        headers = {"Authorization": f"Bearer {user_token['token']}"}
        r = api.post(f"{BASE_URL}/api/payments/revenuecat/sync", headers=headers, json={"active": True})
        assert r.status_code == 200
        assert r.json()["premium"] is True
        # Verify persisted via /auth/me
        me = api.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["user"]["premium"] is True

    def test_sync_active_false_unsets_premium(self, api, user_token):
        headers = {"Authorization": f"Bearer {user_token['token']}"}
        r = api.post(f"{BASE_URL}/api/payments/revenuecat/sync", headers=headers, json={"active": False})
        assert r.status_code == 200
        assert r.json()["premium"] is False
        me = api.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me.json()["user"]["premium"] is False

    def test_sync_rejects_missing_body(self, api, user_token):
        headers = {"Authorization": f"Bearer {user_token['token']}"}
        r = api.post(f"{BASE_URL}/api/payments/revenuecat/sync", headers=headers, json={})
        assert r.status_code == 422
