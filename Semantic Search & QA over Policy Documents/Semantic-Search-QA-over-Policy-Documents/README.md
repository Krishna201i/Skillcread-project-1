# 🌐 PDF Semantic Search & RAG Service

A powerful web service that indexes PDF documents using AI embeddings and provides intelligent search and question-answering capabilities.

## 🚀 Quick Start

### **Start the Website:**
```bash
# Option 1: Double-click start.bat
start.bat

# Option 2: Command line
python main.py
```

### **Access Your Website:**
- **Local:** http://localhost:8000
- **Network:** http://YOUR_IP:8000

## 🌍 Make It Public

### **1. Configure Firewall (Run as Administrator):**
```cmd
netsh advfirewall firewall add rule name="PDF Service" dir=in action=allow protocol=TCP localport=8000
```

### **2. Router Port Forwarding:**
- Access router: `192.168.1.1` or `192.168.0.1`
- Forward port 8000 to your computer's IP
- Your website will be accessible from anywhere!

## ✨ Features

- **📄 PDF Upload & Indexing** - Upload PDFs and automatically extract text
- **🔍 Semantic Search** - Find documents by meaning, not just keywords
- **🤖 AI-Powered Q&A** - Get intelligent answers using RAG (Retrieval Augmented Generation)
- **🌐 Web Interface** - Beautiful, modern UI for easy interaction
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Requirements

- Python 3.8+
- All packages in `requirements.txt`

## 📁 Project Structure

```
├── main.py              # Main application
├── start.bat            # Windows startup script
├── requirements.txt     # Python dependencies
├── static/              # CSS, JavaScript, images
├── templates/           # HTML templates
├── vector_db/           # Document database
└── .env                 # API keys (create this)
```

## 🔑 Setup API Keys

Create a `.env` file with:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## 🎯 Usage

1. **Start the service** with `start.bat`
2. **Upload PDFs** through the web interface
3. **Search documents** using natural language
4. **Ask questions** and get AI-powered answers

## 🌟 Your Website is Ready!

After setup, your service will be accessible from anywhere in the world! 🚀🌍