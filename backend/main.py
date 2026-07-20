import os
from collections import OrderedDict

import pandas as pd
from fastapi import FastAPI, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from src.chatbot import ChatBot

load_dotenv()

app = FastAPI()

# CORS: add Railway/upstream URL via ALLOWED_ORIGINS env var (comma-separated)
_default_origins = [
    "https://cognitus-ai-491210.web.app",
    "http://localhost:3000",
]
_extra = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
_origins = _default_origins + _extra

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# One ChatBot per browser conversation, keyed by the frontend's session id —
# a single shared instance would let concurrent visitors see and overwrite
# each other's uploaded dataset and chat history. Sessions live only in
# memory (same as before), so the oldest one is evicted once the cap is hit
# rather than growing unbounded.
_MAX_SESSIONS = 100
_sessions: "OrderedDict[str, ChatBot]" = OrderedDict()


def get_bot(session_id: str) -> ChatBot:
    if session_id in _sessions:
        _sessions.move_to_end(session_id)
        return _sessions[session_id]
    bot = ChatBot()
    _sessions[session_id] = bot
    if len(_sessions) > _MAX_SESSIONS:
        _sessions.popitem(last=False)
    return bot


# Define the expected JSON payload for the chat endpoint
class ChatRequest(BaseModel):
    message: str

# 4. Simple GET endpoint to confirm server health
@app.get("/")
def read_root():
    return {"status": "Server is running", "message": "Welcome to the Data Analysis Chatbot API!"}

# 2. POST /upload endpoint to load a new dataset
@app.post("/upload")
def upload_file(file: UploadFile = File(...), x_session_id: str = Header(..., alias="X-Session-Id")):
    try:
        # Read the uploaded CSV file into a Pandas DataFrame
        df = pd.read_csv(file.file)

        # Load the data into this session's own chatbot, resetting its history
        bot = get_bot(x_session_id)
        summary = bot.load_data(df)

        return {
            "status": "success",
            "message": f"Successfully loaded {file.filename}",
            "summary": summary
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to upload file: {str(e)}"}

# 3. POST /chat endpoint for AI conversation
@app.post("/chat")
def chat_endpoint(request: ChatRequest, x_session_id: str = Header(..., alias="X-Session-Id")):
    # Pass the message payload into this session's own ChatBot loop
    bot = get_bot(x_session_id)
    result_dict = bot.chat(request.message)

    # Return the full AI dictionary (reply, code, chart) natively to the frontend!
    return result_dict
