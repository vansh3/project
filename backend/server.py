from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hmac
import hashlib
import uuid
import io
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt
import httpx
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALGO = os.environ.get('JWT_ALGORITHM', 'HS256')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    raise RuntimeError("ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env (no hardcoded fallback).")

# Object storage
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "emoticoach-kids"
_storage_key = None

# Razorpay
RZP_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RZP_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RZP_PLAN_ID = os.environ.get('RAZORPAY_PLAN_ID', '')
RZP_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------- Models ----------
class SignupInput(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionInput(BaseModel):
    session_id: str


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    premium: bool
    picture: Optional[str] = None


class VideoCreate(BaseModel):
    title: str
    description: str
    url: Optional[str] = None  # YouTube/Vimeo or storage path
    storage_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_premium: bool = False
    source_type: str = "url"  # "url" or "upload"


class VideoOut(BaseModel):
    video_id: str
    title: str
    description: str
    url: Optional[str]
    storage_path: Optional[str]
    thumbnail_url: Optional[str]
    is_premium: bool
    source_type: str
    created_at: str


class GameProgress(BaseModel):
    game_id: str
    score: int
    completed: bool = False


# ---------- Mood Match question bank (seeded once; served via /games/mood-questions) ----------
MOOD_QUESTION_BANK = [
    # Happy (20)
    {"situation": "Your friend shared their toy with you.", "answer": "Happy"},
    {"situation": "You finished your puzzle all by yourself.", "answer": "Happy"},
    {"situation": "You got a gold star for good work.", "answer": "Happy"},
    {"situation": "Your best friend invited you to their party.", "answer": "Happy"},
    {"situation": "You found your missing teddy bear.", "answer": "Happy"},
    {"situation": "Mom said yes to extra playtime.", "answer": "Happy"},
    {"situation": "You learned to ride your bike without help.", "answer": "Happy"},
    {"situation": "Your team won the game.", "answer": "Happy"},
    {"situation": "You got to eat your favorite ice cream.", "answer": "Happy"},
    {"situation": "You made a new friend at the park.", "answer": "Happy"},
    {"situation": "Your drawing got put on the fridge.", "answer": "Happy"},
    {"situation": "You got a big hug from someone you love.", "answer": "Happy"},
    {"situation": "It's your birthday today!", "answer": "Happy"},
    {"situation": "You helped a friend and they said thank you.", "answer": "Happy"},
    {"situation": "You got picked first for the team.", "answer": "Happy"},
    {"situation": "The sun is shining and you're going to the beach.", "answer": "Happy"},
    {"situation": "Your favorite song came on the radio.", "answer": "Happy"},
    {"situation": "You got a new puppy.", "answer": "Happy"},
    {"situation": "Grandma is coming to visit today.", "answer": "Happy"},
    {"situation": "You did a great job on your spelling test.", "answer": "Happy"},
    # Sad (20)
    {"situation": "Your ice cream fell on the ground.", "answer": "Sad"},
    {"situation": "Your favorite toy broke.", "answer": "Sad"},
    {"situation": "Your best friend moved to a new city.", "answer": "Sad"},
    {"situation": "You lost your favorite stuffed animal.", "answer": "Sad"},
    {"situation": "Nobody wanted to play with you at recess.", "answer": "Sad"},
    {"situation": "Your drawing got ripped by accident.", "answer": "Sad"},
    {"situation": "Your pet is not feeling well.", "answer": "Sad"},
    {"situation": "You didn't get invited to the party.", "answer": "Sad"},
    {"situation": "You missed the school bus.", "answer": "Sad"},
    {"situation": "It rained on the day of the picnic.", "answer": "Sad"},
    {"situation": "Your balloon flew away.", "answer": "Sad"},
    {"situation": "You dropped your lunch tray in the cafeteria.", "answer": "Sad"},
    {"situation": "Your team lost the game.", "answer": "Sad"},
    {"situation": "You said goodbye to a good friend.", "answer": "Sad"},
    {"situation": "Your sandcastle got washed away by the waves.", "answer": "Sad"},
    {"situation": "You couldn't find your favorite book.", "answer": "Sad"},
    {"situation": "Your plant wilted even though you watered it.", "answer": "Sad"},
    {"situation": "You weren't able to go to the fun fair.", "answer": "Sad"},
    {"situation": "Your friend forgot your birthday.", "answer": "Sad"},
    {"situation": "You got left out of a game at recess.", "answer": "Sad"},
    # Angry (20)
    {"situation": "Someone took your turn on the swing.", "answer": "Angry"},
    {"situation": "Your little brother broke your toy on purpose.", "answer": "Angry"},
    {"situation": "Someone cut in front of you in line.", "answer": "Angry"},
    {"situation": "Your sibling changed the TV channel without asking.", "answer": "Angry"},
    {"situation": "Someone laughed at your drawing.", "answer": "Angry"},
    {"situation": "Your friend broke a promise to you.", "answer": "Angry"},
    {"situation": "Someone took your snack without asking.", "answer": "Angry"},
    {"situation": "You got blamed for something you didn't do.", "answer": "Angry"},
    {"situation": "Your tower of blocks got knocked down on purpose.", "answer": "Angry"},
    {"situation": "Someone called you a mean name.", "answer": "Angry"},
    {"situation": "Your sister read your diary.", "answer": "Angry"},
    {"situation": "Someone copied your homework without asking.", "answer": "Angry"},
    {"situation": "You were told \"no\" to something you really wanted.", "answer": "Angry"},
    {"situation": "Your friend wouldn't share the game controller.", "answer": "Angry"},
    {"situation": "Someone messed up the bed you just made.", "answer": "Angry"},
    {"situation": "You were interrupted while telling a story.", "answer": "Angry"},
    {"situation": "Someone took credit for your idea.", "answer": "Angry"},
    {"situation": "Your sibling ate the last cookie you were saving.", "answer": "Angry"},
    {"situation": "Someone pushed in front of you at the water fountain.", "answer": "Angry"},
    {"situation": "Your friend wouldn't give your toy back.", "answer": "Angry"},
    # Scared (20)
    {"situation": "There is loud thunder at night.", "answer": "Scared"},
    {"situation": "You see a big spider in your room.", "answer": "Scared"},
    {"situation": "The lights went out suddenly.", "answer": "Scared"},
    {"situation": "You heard a strange noise under your bed.", "answer": "Scared"},
    {"situation": "You're about to go to the doctor for a shot.", "answer": "Scared"},
    {"situation": "You got lost in a big store for a minute.", "answer": "Scared"},
    {"situation": "A dog you don't know is barking loudly at you.", "answer": "Scared"},
    {"situation": "You have to give a speech in front of the class.", "answer": "Scared"},
    {"situation": "You're going down a really tall slide for the first time.", "answer": "Scared"},
    {"situation": "You watched a scary movie right before bed.", "answer": "Scared"},
    {"situation": "The power went out during a storm.", "answer": "Scared"},
    {"situation": "You're starting at a brand new school tomorrow.", "answer": "Scared"},
    {"situation": "You heard a loud crash in the kitchen.", "answer": "Scared"},
    {"situation": "You're swimming in deep water for the first time.", "answer": "Scared"},
    {"situation": "Someone told a scary story around a campfire.", "answer": "Scared"},
    {"situation": "You're home alone and hear a creaky noise.", "answer": "Scared"},
    {"situation": "The roller coaster is about to start.", "answer": "Scared"},
    {"situation": "You see a shadow that looks like a monster.", "answer": "Scared"},
    {"situation": "You have to sleep in a dark room by yourself.", "answer": "Scared"},
    {"situation": "A big wave is coming toward you at the beach.", "answer": "Scared"},
    # Surprised (20)
    {"situation": "You got a surprise birthday gift!", "answer": "Surprised"},
    {"situation": "Your friends threw you a surprise party.", "answer": "Surprised"},
    {"situation": "You found money in your old jacket pocket.", "answer": "Surprised"},
    {"situation": "Your favorite show had an unexpected ending.", "answer": "Surprised"},
    {"situation": "Your parents brought home a new puppy.", "answer": "Surprised"},
    {"situation": "You opened your lunchbox and found a special treat.", "answer": "Surprised"},
    {"situation": "Your teacher announced a surprise field trip.", "answer": "Surprised"},
    {"situation": "Your cousin showed up at your door unannounced.", "answer": "Surprised"},
    {"situation": "You won a prize you didn't expect.", "answer": "Surprised"},
    {"situation": "Your friend did a magic trick that fooled you.", "answer": "Surprised"},
    {"situation": "You found a hidden room at your grandparents' house.", "answer": "Surprised"},
    {"situation": "Your plant grew a flower overnight.", "answer": "Surprised"},
    {"situation": "Someone jumped out and said \"boo\" playfully.", "answer": "Surprised"},
    {"situation": "You got an extra scoop of ice cream for free.", "answer": "Surprised"},
    {"situation": "The ending of the book had a big twist.", "answer": "Surprised"},
    {"situation": "Your parents said you're going on a surprise vacation.", "answer": "Surprised"},
    {"situation": "A balloon popped with confetti inside.", "answer": "Surprised"},
    {"situation": "You found a note hidden in your backpack from a friend.", "answer": "Surprised"},
    {"situation": "Your favorite singer showed up on TV unexpectedly.", "answer": "Surprised"},
    {"situation": "It started snowing in the middle of summer!", "answer": "Surprised"},
]


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def _user_from_token(token: str) -> dict:
    # Try JWT first (email/password accounts)
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if user:
            return user
    except Exception:
        pass
    # Try session token (Google auth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        exp = session.get("expires_at")
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp and exp > datetime.now(timezone.utc):
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
            if user:
                return user
    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    return await _user_from_token(token)


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def user_public(u: dict) -> dict:
    return {
        "user_id": u["user_id"],
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "user"),
        "premium": u.get("premium", False),
        "picture": u.get("picture"),
    }


# ---------- Object Storage ----------
def _init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY missing")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _put_object(path: str, data: bytes, content_type: str):
    key = _init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=600,
    )
    resp.raise_for_status()
    return resp.json()


def _get_object(path: str):
    global _storage_key
    key = _init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=120,
    )
    if resp.status_code == 503:
        _storage_key = None
        key = _init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=120,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.videos.create_index("video_id", unique=True)
    await db.subscriptions.create_index("user_id", unique=True)
    await db.razorpay_events.create_index("event_id", unique=True)

    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "name": "Richa Madan",
            "role": "admin",
            "premium": True,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "picture": None,
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")
    elif existing.get("name") != "Richa Madan":
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"name": "Richa Madan"}})
        logger.info(f"Updated admin display name for: {ADMIN_EMAIL}")

    # Seed demo videos if none
    count = await db.videos.count_documents({})
    if count == 0:
        demo = [
            {"video_id": f"vid_{uuid.uuid4().hex[:10]}", "title": "Understanding Big Feelings",
             "description": "A gentle guide for parents on helping kids navigate overwhelming emotions.",
             "url": "https://www.w3schools.com/html/mov_bbb.mp4", "storage_path": None,
             "thumbnail_url": "https://images.unsplash.com/photo-1758612897934-a56dbd09a39e?w=800",
             "is_premium": False, "source_type": "url",
             "created_at": datetime.now(timezone.utc)},
            {"video_id": f"vid_{uuid.uuid4().hex[:10]}", "title": "Calm Mornings, Happy Days",
             "description": "Build a calm morning routine that reduces meltdowns and sets the tone for the day.",
             "url": "https://www.w3schools.com/html/mov_bbb.mp4", "storage_path": None,
             "thumbnail_url": "https://images.unsplash.com/photo-1758687126048-4790d3d7e4ea?w=800",
             "is_premium": False, "source_type": "url",
             "created_at": datetime.now(timezone.utc)},
            {"video_id": f"vid_{uuid.uuid4().hex[:10]}", "title": "The Art of Validating Feelings",
             "description": "Premium series: Learn the key phrases that make kids feel truly heard.",
             "url": "https://www.w3schools.com/html/mov_bbb.mp4", "storage_path": None,
             "thumbnail_url": "https://images.unsplash.com/photo-1721930878634-41c6f5f0746f?w=800",
             "is_premium": True, "source_type": "url",
             "created_at": datetime.now(timezone.utc)},
        ]
        await db.videos.insert_many(demo)

    # Seed mood-match question bank (~100 scenarios across 5 feelings) if empty
    if await db.mood_questions.count_documents({}) == 0:
        await db.mood_questions.insert_many([{"id": f"mq_{uuid.uuid4().hex[:10]}", **q} for q in MOOD_QUESTION_BANK])
        logger.info(f"Seeded {len(MOOD_QUESTION_BANK)} mood-match questions")


# ---------- Auth routes ----------
@api_router.post("/auth/signup")
async def signup(data: SignupInput):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "role": "user",
        "premium": False,
        "password_hash": hash_password(data.password),
        "picture": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)
    token = make_token(user_id)
    return {"token": token, "user": user_public(doc)}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    user = await db.users.find_one({"email": data.email})
    if not user or not user.get("password_hash") or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token(user["user_id"])
    return {"token": token, "user": user_public(user)}


@api_router.post("/auth/session")
async def auth_session(data: GoogleSessionInput):
    """Exchange Emergent session_id for app session_token."""
    sid = data.session_id
    if not sid:
        raise HTTPException(status_code=400, detail="Missing session_id")
    try:
        async with httpx.AsyncClient(timeout=20) as hc:
            r = await hc.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": sid},
            )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        data_j = r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("session exchange failed")
        raise HTTPException(status_code=401, detail="Session exchange failed")

    email = data_j.get("email")
    name = data_j.get("name") or (email.split("@")[0] if email else "User")
    picture = data_j.get("picture")
    session_token = data_j.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=401, detail="Incomplete session data")

    user = await db.users.find_one({"email": email})
    if user:
        user_id = user["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"picture": picture, "name": name}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": "user",
            "premium": False,
            "picture": picture,
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.insert_one(user)

    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
    })

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"session_token": session_token, "user": user_public(user_doc)}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user_public(user)}


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        tok = authorization.split(" ", 1)[1].strip()
        await db.user_sessions.delete_one({"session_token": tok})
    return {"ok": True}


# ---------- Videos ----------
@api_router.get("/videos")
async def list_videos(user: dict = Depends(get_current_user)):
    items = await db.videos.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    out = []
    for v in items:
        is_premium = v.get("is_premium", False)
        locked = is_premium and not user.get("premium") and user.get("role") != "admin"
        v["created_at"] = v["created_at"].isoformat() if isinstance(v.get("created_at"), datetime) else v.get("created_at")
        v["locked"] = locked
        out.append(v)
    return {"videos": out}


@api_router.get("/videos/{video_id}")
async def get_video(video_id: str, user: dict = Depends(get_current_user)):
    v = await db.videos.find_one({"video_id": video_id}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Not found")
    is_premium = v.get("is_premium", False)
    if is_premium and not user.get("premium") and user.get("role") != "admin":
        raise HTTPException(status_code=402, detail="Premium content locked")
    v["created_at"] = v["created_at"].isoformat() if isinstance(v.get("created_at"), datetime) else v.get("created_at")
    # If storage_path, provide a token-signed URL for playback
    if v.get("storage_path"):
        token = make_token(user["user_id"])
        v["url"] = f"/api/files/{v['storage_path']}?token={token}"
    return v


@api_router.post("/videos")
async def create_video(data: VideoCreate, admin: dict = Depends(require_admin)):
    video_id = f"vid_{uuid.uuid4().hex[:10]}"
    doc = {
        "video_id": video_id,
        "title": data.title,
        "description": data.description,
        "url": data.url,
        "storage_path": data.storage_path,
        "thumbnail_url": data.thumbnail_url,
        "is_premium": data.is_premium,
        "source_type": data.source_type,
        "created_at": datetime.now(timezone.utc),
    }
    await db.videos.insert_one(doc)
    doc["created_at"] = doc["created_at"].isoformat()
    doc.pop("_id", None)
    return doc


@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str, admin: dict = Depends(require_admin)):
    r = await db.videos.delete_one({"video_id": video_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ---------- Upload / Download ----------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    fname = file.filename or "video.mp4"
    ext = (fname.rsplit(".", 1)[-1] if "." in fname else "bin").lower()
    path = f"{APP_NAME}/uploads/{admin['user_id']}/{uuid.uuid4().hex}.{ext}"
    content = await file.read()
    if len(content) > 500 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 500MB)")
    result = await run_in_threadpool(_put_object, path, content, file.content_type or "application/octet-stream")
    return {"path": result["path"], "size": result.get("size", len(content)), "content_type": file.content_type}


@api_router.get("/files/{path:path}")
async def get_file(path: str, token: Optional[str] = None, authorization: Optional[str] = Header(None)):
    # Accept token via query or Authorization bearer
    tok = token
    if not tok and authorization and authorization.startswith("Bearer "):
        tok = authorization.split(" ", 1)[1].strip()
    if not tok:
        raise HTTPException(status_code=401, detail="Missing token")
    await _user_from_token(tok)
    try:
        content, ctype = await run_in_threadpool(_get_object, path)
    except Exception as e:
        logger.exception("file fetch failed")
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=content, media_type=ctype)


# ---------- Games progress ----------
@api_router.post("/games/progress")
async def save_progress(data: GameProgress, user: dict = Depends(get_current_user)):
    await db.game_progress.update_one(
        {"user_id": user["user_id"], "game_id": data.game_id},
        {"$set": {
            "user_id": user["user_id"],
            "game_id": data.game_id,
            "score": data.score,
            "completed": data.completed,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"ok": True}


@api_router.get("/games/progress")
async def get_progress(user: dict = Depends(get_current_user)):
    items = await db.game_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    for it in items:
        if isinstance(it.get("updated_at"), datetime):
            it["updated_at"] = it["updated_at"].isoformat()
    return {"progress": items}


@api_router.get("/games/mood-questions")
async def get_mood_questions(count: int = 10, user: dict = Depends(get_current_user)):
    count = max(1, min(count, 50))
    items = await db.mood_questions.aggregate([
        {"$sample": {"size": count}},
        {"$project": {"_id": 0, "situation": 1, "answer": 1}},
    ]).to_list(count)
    return {"questions": items}


# ---------- Razorpay subscriptions ----------
async def razorpay_api(method: str, path: str, **kwargs):
    if not RZP_KEY_ID or not RZP_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    async with httpx.AsyncClient(base_url="https://api.razorpay.com", timeout=30) as c:
        r = await c.request(method, path, auth=(RZP_KEY_ID, RZP_KEY_SECRET), **kwargs)
        if r.status_code >= 400:
            logger.error(f"Razorpay {method} {path} -> {r.status_code} {r.text}")
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()


@api_router.post("/payments/subscription")
async def create_subscription(user: dict = Depends(get_current_user)):
    old = await db.subscriptions.find_one({"user_id": user["user_id"], "status": {"$in": ["authenticated", "active", "created"]}})
    if old:
        return {"subscription_id": old["razorpay_subscription_id"], "key_id": RZP_KEY_ID}
    if not RZP_PLAN_ID:
        raise HTTPException(status_code=500, detail="Plan not configured")
    sub = await razorpay_api("POST", "/v1/subscriptions", json={
        "plan_id": RZP_PLAN_ID, "total_count": 120, "quantity": 1,
        "customer_notify": 1, "notes": {"user_id": user["user_id"]},
    })
    await db.subscriptions.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "user_id": user["user_id"],
            "razorpay_subscription_id": sub["id"],
            "plan_id": RZP_PLAN_ID,
            "status": sub.get("status", "created"),
            "premium": False,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"subscription_id": sub["id"], "key_id": RZP_KEY_ID}


class VerifyPayload(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


@api_router.post("/payments/verify")
async def verify_payment(data: VerifyPayload, user: dict = Depends(get_current_user)):
    row = await db.subscriptions.find_one({"user_id": user["user_id"], "razorpay_subscription_id": data.razorpay_subscription_id})
    if not row:
        raise HTTPException(status_code=400, detail="Unknown subscription")
    message = f"{data.razorpay_payment_id}|{data.razorpay_subscription_id}"
    expected = hmac.new(RZP_KEY_SECRET.encode(), message.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, data.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    await db.subscriptions.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"status": "authenticated", "premium": True,
                  "last_payment_id": data.razorpay_payment_id,
                  "updated_at": datetime.now(timezone.utc)}},
    )
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"premium": True}})
    return {"ok": True, "premium": True}


class RevenueCatSyncPayload(BaseModel):
    active: bool


@api_router.post("/payments/revenuecat/sync")
async def sync_revenuecat_premium(data: RevenueCatSyncPayload, user: dict = Depends(get_current_user)):
    """Sync this authenticated user's premium flag from a RevenueCat entitlement
    check the client already performed via the SDK (customerInfo.entitlements.active).
    RevenueCat itself remains the source of truth for native purchases; this just
    mirrors it onto the existing `premium` field used to gate video playback."""
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"premium": data.active}})
    return {"ok": True, "premium": data.active}


@api_router.post("/payments/razorpay/webhook")
async def razorpay_webhook(request: Request):
    raw = await request.body()
    sig = request.headers.get("x-razorpay-signature", "")
    event_id = request.headers.get("x-razorpay-event-id", "")
    if not RZP_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not set")
    expected = hmac.new(RZP_WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=400, detail="Invalid signature")
    try:
        await db.razorpay_events.insert_one({"event_id": event_id or f"evt_{uuid.uuid4().hex}", "received_at": datetime.now(timezone.utc)})
    except Exception as e:
        if "duplicate" in str(e).lower():
            return {"ok": True, "duplicate": True}
    body = await request.json()
    event = body.get("event", "")
    entity = body.get("payload", {}).get("subscription", {}).get("entity", {})
    sid = entity.get("id")
    if sid:
        status = entity.get("status")
        premium = status in {"authenticated", "active"}
        if event in {"subscription.halted", "subscription.cancelled", "subscription.completed"}:
            premium = False
        row = await db.subscriptions.find_one_and_update(
            {"razorpay_subscription_id": sid},
            {"$set": {"status": status, "premium": premium, "last_event": event,
                      "updated_at": datetime.now(timezone.utc)}},
        )
        if row:
            await db.users.update_one({"user_id": row["user_id"]}, {"$set": {"premium": premium}})
    return {"ok": True}


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"message": "EmotiCoach API", "ok": True}


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
