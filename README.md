# Cognitus AI - Data Analysis Chatbot

An AI-powered data analysis chatbot that lets you upload a CSV dataset and ask questions about it in plain language. The assistant generates Python code to analyze your data and returns human-readable answers alongside interactive charts.

**Live Demo:** [https://cognitus-ai-491210.web.app](https://cognitus-ai-491210.web.app)

---

## Features

- Upload any CSV file and get an instant dataset summary
- Ask questions in natural language (supports English and Indonesian)
- AI generates and executes pandas code behind the scenes
- Self-healing code execution: if the generated code fails, the AI automatically retries and fixes it (up to 3 attempts)
- Structured JSON responses with a human-readable answer, the generated code, and optional chart data
- Interactive charts rendered with Chart.js (bar, pie, line)
- Paginated, sortable data preview table
- Chat history management with rename and delete support
- Dark and light theme toggle
- Responsive sidebar layout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Python, FastAPI |
| AI Model | Groq API (llama-3.3-70b-versatile) |
| Data Processing | pandas |
| Frontend Hosting | Firebase Hosting |
| Backend Containerization | Docker |

---

## Project Structure

```
data-analysis-chatbot/
├── backend/
│   ├── src/
│   │   ├── chatbot.py          # Core ChatBot class: conversation history, Groq API calls, self-healing loop
│   │   ├── code_executor.py    # Parses and executes AI-generated code safely
│   │   └── data_analyzer.py    # Generates dataset summaries for the system prompt
│   ├── main.py                 # FastAPI app: /upload and /chat endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                    # Environment variables (not committed)
├── frontend/
│   ├── index.html              # Single-page frontend application
│   ├── logo-black.png
│   └── logo-white.png
├── firebase.json               # Firebase Hosting config
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- A [Groq API key](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/aldeniaalexandra/data-analysis-chatbot.git
cd data-analysis-chatbot
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the backend server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 5. Open the frontend

Open `frontend/index.html` directly in your browser, or serve it with any static file server.

> **Note:** The frontend is configured to point to the deployed backend URL by default. For local development, update the `API_BASE` variable in `frontend/index.html` to `http://localhost:8000`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/upload` | Upload a CSV file and load it into the session |
| POST | `/chat` | Send a message and receive an AI-generated analysis |

### POST /chat - Response Format

```json
{
  "reply": "The average age of customers is 34.5 years.",
  "code": "result = df['age'].mean()",
  "chart": {
    "type": "bar",
    "title": "Top 5 Product Categories by Revenue",
    "labels": ["Electronics", "Clothing", "Food", "Books", "Toys"],
    "values": [45000, 32000, 28000, 15000, 9000]
  }
}
```

`chart` is `null` when a chart is not relevant to the question.

---

## Running with Docker

```bash
cd backend
docker build -t cognitus-ai-backend .
docker run -p 8080:8080 --env-file .env cognitus-ai-backend
```

---

## Deploying the Frontend

The frontend is deployed to Firebase Hosting. To redeploy:

```bash
firebase deploy --only hosting
```

---

## Usage

1. Open the app and click **Upload CSV** to load your dataset.
2. The app will display a paginated, sortable preview of your data.
3. Type a question in the chat input (e.g., "What is the average sales per region?").
4. The AI will analyze your data and return a written answer, the code it ran, and a chart if applicable.
5. Use the sidebar to start new conversations or switch between previous sessions.
