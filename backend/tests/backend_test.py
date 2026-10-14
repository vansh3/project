"""EmotiCoach backend API test suite.

Covers: auth (signup/login/me/invalid), videos list/get with premium gating,
admin-only create/delete, upload/file download, games progress CRUD,
and Razorpay unconfigured expected error.
"""
import io
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load frontend .env to get the public backend URL that users hit
load_dotenv(Path("/app/frontend/.env"))
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")

# Load backend .env to get seeded admin credentials (never hardcode these)
load_dotenv(Path("/app/backend/.env"))
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["premium"] is True
    return data["token"]


@pytest.fixture(scope="session")
def user_token(api):
    # Signup fresh user per test session
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
    r = api.post(f"{BASE_URL}/api/auth/signup",
                 json={"email": email, "password": "Pass@1234", "name": "Test User"})
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "user"
    assert data["user"]["premium"] is False
    return {"token": data["token"], "email": email, "user_id": data["user"]["user_id"]}


# ---------- Health ----------
def test_health(api):
    r = api.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---------- Auth ----------
class TestAuth:
    def test_signup_duplicate_email(self, api, user_token):
        r = api.post(f"{BASE_URL}/api/auth/signup",
                     json={"email": user_token["email"], "password": "Pass@1234", "name": "Dup"})
        assert r.status_code == 400

    def test_login_invalid_credentials(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": "WrongPass"})
        assert r.status_code == 401

    def test_login_unknown_email(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": "noone-xyz@example.com", "password": "whatever"})
        assert r.status_code == 401

    def test_me_requires_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_valid_token(self, api, user_token):
        r = api.get(f"{BASE_URL}/api/auth/me",
                    headers={"Authorization": f"Bearer {user_token['token']}"})
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["email"] == user_token["email"]
        assert u["user_id"] == user_token["user_id"]

    def test_me_invalid_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me",
                    headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401


# ---------- Videos ----------
class TestVideos:
    def test_list_videos_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/videos")
        assert r.status_code == 401

    def test_list_videos_locked_flag_for_free_user(self, api, user_token):
        r = api.get(f"{BASE_URL}/api/videos",
                    headers={"Authorization": f"Bearer {user_token['token']}"})
        assert r.status_code == 200
        vids = r.json()["videos"]
        assert isinstance(vids, list) and len(vids) >= 1
        premium = [v for v in vids if v["is_premium"]]
        free = [v for v in vids if not v["is_premium"]]
        # Premium videos locked for free user
        for v in premium:
            assert v["locked"] is True, f"premium video not locked for free user: {v}"
        for v in free:
            assert v["locked"] is False

    def test_list_videos_locked_flag_for_admin(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/videos",
                    headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        vids = r.json()["videos"]
        for v in vids:
            assert v["locked"] is False, f"video should not be locked for admin: {v}"

    def test_get_premium_video_402_for_free(self, api, user_token, admin_token):
        # Find a premium video via admin list
        r = api.get(f"{BASE_URL}/api/videos",
                    headers={"Authorization": f"Bearer {admin_token}"})
        premium = [v for v in r.json()["videos"] if v["is_premium"]]
        assert premium, "no premium seed video found"
        vid = premium[0]["video_id"]
        rr = api.get(f"{BASE_URL}/api/videos/{vid}",
                     headers={"Authorization": f"Bearer {user_token['token']}"})
        assert rr.status_code == 402

    def test_get_premium_video_200_for_admin(self, api, admin_token):
        r = api.get(f"{BASE_URL}/api/videos",
                   headers={"Authorization": f"Bearer {admin_token}"})
        premium = [v for v in r.json()["videos"] if v["is_premium"]]
        assert premium
        rr = api.get(f"{BASE_URL}/api/videos/{premium[0]['video_id']}",
                     headers={"Authorization": f"Bearer {admin_token}"})
        assert rr.status_code == 200
        assert rr.json()["video_id"] == premium[0]["video_id"]

    def test_get_free_video_200_for_free_user(self, api, user_token, admin_token):
        r = api.get(f"{BASE_URL}/api/videos",
                   headers={"Authorization": f"Bearer {admin_token}"})
        free = [v for v in r.json()["videos"] if not v["is_premium"]]
        assert free
        rr = api.get(f"{BASE_URL}/api/videos/{free[0]['video_id']}",
                     headers={"Authorization": f"Bearer {user_token['token']}"})
        assert rr.status_code == 200

    def test_get_video_not_found(self, api, user_token):
        r = api.get(f"{BASE_URL}/api/videos/nonexistent_abc",
                   headers={"Authorization": f"Bearer {user_token['token']}"})
        assert r.status_code == 404

    def test_create_video_forbidden_for_regular_user(self, api, user_token):
        r = api.post(f"{BASE_URL}/api/videos",
                     headers={"Authorization": f"Bearer {user_token['token']}"},
                     json={"title": "x", "description": "y", "url": "https://x", "is_premium": False, "source_type": "url"})
        assert r.status_code == 403

    def test_admin_create_and_delete_video(self, api, admin_token):
        payload = {
            "title": "TEST_video",
            "description": "test desc",
            "url": "https://www.w3schools.com/html/mov_bbb.mp4",
            "thumbnail_url": None,
            "is_premium": False,
            "source_type": "url",
        }
        r = api.post(f"{BASE_URL}/api/videos",
                    headers={"Authorization": f"Bearer {admin_token}"}, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["title"] == "TEST_video"
        vid = created["video_id"]
        # Verify via GET
        g = api.get(f"{BASE_URL}/api/videos/{vid}",
                   headers={"Authorization": f"Bearer {admin_token}"})
        assert g.status_code == 200
        # Delete
        d = api.delete(f"{BASE_URL}/api/videos/{vid}",
                      headers={"Authorization": f"Bearer {admin_token}"})
        assert d.status_code == 200
        # Verify gone
        g2 = api.get(f"{BASE_URL}/api/videos/{vid}",
                    headers={"Authorization": f"Bearer {admin_token}"})
        assert g2.status_code == 404

    def test_delete_video_forbidden_for_user(self, api, user_token):
        r = api.delete(f"{BASE_URL}/api/videos/anyid",
                      headers={"Authorization": f"Bearer {user_token['token']}"})
        assert r.status_code == 403


# ---------- Upload / Files ----------
class TestUpload:
    def test_upload_requires_admin(self, api, user_token):
        files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(f"{BASE_URL}/api/upload",
                         headers={"Authorization": f"Bearer {user_token['token']}"},
                         files=files)
        assert r.status_code == 403

    def test_upload_and_download_as_admin(self, api, admin_token):
        payload = b"TEST_FILE_CONTENT_" + uuid.uuid4().hex.encode()
        files = {"file": ("test.txt", io.BytesIO(payload), "text/plain")}
        r = requests.post(f"{BASE_URL}/api/upload",
                         headers={"Authorization": f"Bearer {admin_token}"},
                         files=files)
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
        path = r.json()["path"]
        assert path
        # Download via Bearer
        d = requests.get(f"{BASE_URL}/api/files/{path}",
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert d.status_code == 200
        assert d.content == payload
        # Download via ?token=
        d2 = requests.get(f"{BASE_URL}/api/files/{path}?token={admin_token}")
        assert d2.status_code == 200
        assert d2.content == payload

    def test_file_requires_token(self, api):
        r = requests.get(f"{BASE_URL}/api/files/some/path.txt")
        assert r.status_code == 401


# ---------- Games progress ----------
class TestGames:
    def test_save_and_get_progress(self, api, user_token):
        headers = {"Authorization": f"Bearer {user_token['token']}"}
        r = api.post(f"{BASE_URL}/api/games/progress",
                    headers=headers,
                    json={"game_id": "mood-match", "score": 42, "completed": True})
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # Upsert should overwrite
        r2 = api.post(f"{BASE_URL}/api/games/progress",
                     headers=headers,
                     json={"game_id": "mood-match", "score": 99, "completed": True})
        assert r2.status_code == 200
        g = api.get(f"{BASE_URL}/api/games/progress", headers=headers)
        assert g.status_code == 200
        items = g.json()["progress"]
        found = [i for i in items if i["game_id"] == "mood-match"]
        assert found and found[0]["score"] == 99

    def test_progress_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/games/progress")
        assert r.status_code == 401


# ---------- Razorpay (expected unconfigured) ----------
class TestPayments:
    def test_subscription_returns_500_when_unconfigured(self, api, user_token):
        r = api.post(f"{BASE_URL}/api/payments/subscription",
                    headers={"Authorization": f"Bearer {user_token['token']}"})
        # Expected per problem statement
        assert r.status_code == 500
        assert "Razorpay not configured" in r.text or "Plan not configured" in r.text
