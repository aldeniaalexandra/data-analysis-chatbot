import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from src.chatbot import ChatBot

# Load environment variables
load_dotenv()

# 1. Initialize the FastAPI app and a single ChatBot instance
app = FastAPI()

# Add CORS middleware to allow the frontend to talk to the API locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = ChatBot()

# Define the expected JSON payload for the chat endpoint
class ChatRequest(BaseModel):
    message: str

# 4. Simple GET endpoint to confirm server health
@app.get("/")
def read_root():
    return {"status": "Server is running", "message": "Welcome to the Data Analysis Chatbot API!"}

# 2. POST /upload endpoint to load a new dataset
@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    try:
        # Read the uploaded CSV file into a Pandas DataFrame
        df = pd.read_csv(file.file)
        
        # Load the data into the chatbot, resetting the conversation history
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
def chat_endpoint(request: ChatRequest):
    # Pass the message payload directly into our ChatBot's loop
    result_dict = bot.chat(request.message)
    
    # Return the full AI dictionary (reply, code, chart) natively to the frontend!
    return result_dict
