import os
import asyncio
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import PyPDF2
import io
from sentence_transformers import SentenceTransformer
import chromadb
import google.generativeai as genai
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Global variables for models and DB (initialized in initialize_services)
sentence_model = None
chroma_client = None
collection = None
gemini_model = None

# Configuration
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
VECTOR_DB_PATH = "vector_db"

# Lifespan event handler for FastAPI application startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    initialize_services()
    yield
    # Shutdown (if needed, e.g., closing DB connections)

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="PDF Semantic Search & RAG Service",
    version="1.0.0",
    lifespan=lifespan # Integrate the lifespan context manager
)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Add CORS middleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Pydantic models
class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

class DocumentInfo(BaseModel):
    filename: str
    chunks: int

class SearchResult(BaseModel):
    content: str
    filename: str
    similarity_score: float

class RAGResponse(BaseModel):
    answer: str
    sources: List[SearchResult]
    query: str

def initialize_services():
    global sentence_model, chroma_client, collection, gemini_model
    
    try:
        print("Loading sentence transformer model...")
        sentence_model = SentenceTransformer(EMBEDDING_MODEL)
        print("✅ Sentence transformer model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading sentence transformer model: {str(e)}")
        raise
    
    try:
        print("Initializing ChromaDB...")
        chroma_client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
        
        try:
            collection = chroma_client.get_collection("pdf_documents")
            print("✅ Using existing ChromaDB collection")
        except:
            collection = chroma_client.create_collection(name="pdf_documents")
            print("✅ Created new ChromaDB collection")
    except Exception as e:
        print(f"❌ Error initializing ChromaDB: {str(e)}")
        raise
    
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            print("✅ Gemini API initialized successfully")
        except Exception as e:
            print(f"❌ Error initializing Gemini API: {str(e)}")
            gemini_model = None
    else:
        print("⚠️  Warning: GEMINI_API_KEY not set or using default value")
        print("   Create a .env file with your actual Gemini API key")
        gemini_model = None

def extract_text_from_pdf(pdf_file: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        if len(pdf_reader.pages) == 0:
            raise HTTPException(status_code=400, detail="PDF file appears to be empty or corrupted")
        
        text = ""
        for i, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                else:
                    print(f"⚠️  Warning: Page {i+1} has no extractable text")
            except Exception as e:
                print(f"⚠️  Warning: Could not extract text from page {i+1}: {str(e)}")
                continue
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        return text
    except Exception as e:
        if "PDF" in str(e):
            raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
        else:
            raise HTTPException(status_code=500, detail=f"Unexpected error processing PDF: {str(e)}")

def chunk_text(text: str) -> List[str]:
    """Split text into overlapping chunks with better boundary handling"""
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + CHUNK_SIZE
        
        # If this is not the last chunk, try to find a good break point
        if end < len(text):
            # Look for sentence endings or word boundaries
            for i in range(end, max(start + CHUNK_SIZE - 100, start), -1):
                if text[i] in '.!?':
                    end = i + 1
                    break
                elif text[i] == ' ':
                    end = i
                    break
        
        chunk = text[start:end].strip()
        if chunk:  # Only add non-empty chunks
            chunks.append(chunk)
        
        if end >= len(text):
            break
            
        start = end - CHUNK_OVERLAP
        # Ensure we don't go backwards
        if start <= 0:
            start = end
    
    return chunks

def process_pdf_document(pdf_file: bytes, filename: str) -> dict:
    text = extract_text_from_pdf(pdf_file)
    chunks = chunk_text(text)
    embeddings = sentence_model.encode(chunks).tolist()
    
    metadatas = []
    ids = []
    for i, chunk in enumerate(chunks):
        metadatas.append({"filename": filename, "chunk_index": i})
        ids.append(f"{filename}_{i}")
    
    return {"chunks": chunks, "embeddings": embeddings, "metadatas": metadatas, "ids": ids}

def search_similar_chunks(query: str, top_k: int = 5) -> List[SearchResult]:
    """Search for similar chunks using vector similarity"""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        query_embedding = sentence_model.encode([query])
        results = collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=top_k
        )
        
        if not results['ids'] or not results['ids'][0]:
            return []
        
        search_results = []
        for i in range(len(results['ids'][0])):
            try:
                result = SearchResult(
                    content=results['documents'][0][i],
                    filename=results['metadatas'][0][i]['filename'],
                    similarity_score=float(results['distances'][0][i])
                )
                search_results.append(result)
            except (IndexError, KeyError) as e:
                print(f"⚠️  Warning: Error processing search result {i}: {str(e)}")
                continue
        
        return search_results
    except Exception as e:
        print(f"❌ Error in search_similar_chunks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")

def generate_rag_answer(query: str, context_chunks: List[SearchResult]) -> str:
    """Generate answer using RAG with Gemini API"""
    if not gemini_model:
        return "Gemini API not configured. Please set GEMINI_API_KEY environment variable."
    
    if not context_chunks:
        return "No relevant documents found to answer this question."
    
    try:
        # Prepare context with better formatting
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            context_parts.append(f"Document {i}: {chunk.filename}\nRelevance Score: {chunk.similarity_score:.4f}\nContent: {chunk.content}")
        
        context = "\n\n---\n\n".join(context_parts)
        
        prompt = f"""You are a helpful assistant that answers questions based on the provided document context.

Context from documents:
{context}

Question: {query}

Instructions:
1. Answer the question based ONLY on the information provided in the context above
2. If the context doesn't contain enough information to answer the question, clearly state this
3. Cite the source documents when possible
4. Be accurate and concise
5. If multiple documents provide conflicting information, mention this

Answer:"""
        
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        error_msg = f"Error generating answer: {str(e)}"
        print(f"❌ RAG generation error: {error_msg}")
        return error_msg

@app.post("/upload", response_model=DocumentInfo)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a PDF document"""
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Check file size (limit to 50MB)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(status_code=400, detail="File size too large. Maximum size is 50MB")
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    try:
        doc_info = process_pdf_document(content, file.filename)
        
        # Add to vector database
        collection.add(
            embeddings=doc_info["embeddings"],
            documents=doc_info["chunks"],
            metadatas=doc_info["metadatas"],
            ids=doc_info["ids"]
        )
        
        print(f"✅ Successfully indexed {file.filename} with {len(doc_info['chunks'])} chunks")
        
        return DocumentInfo(filename=file.filename, chunks=len(doc_info["chunks"]))
        
    except Exception as e:
        print(f"❌ Error processing document {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/search", response_model=List[SearchResult])
async def search_documents(request: QueryRequest):
    """Search for similar document chunks"""
    # Validate input
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    if request.top_k < 1 or request.top_k > 50:
        raise HTTPException(status_code=400, detail="top_k must be between 1 and 50")
    
    try:
        results = search_similar_chunks(request.query, request.top_k)
        print(f"✅ Search completed for query: '{request.query}' - Found {len(results)} results")
        return results
    except Exception as e:
        print(f"❌ Search error for query '{request.query}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")

@app.post("/rag", response_model=RAGResponse)
async def generate_rag_answer_endpoint(request: QueryRequest):
    """Generate answer using RAG with Gemini API"""
    # Validate input
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    if request.top_k < 1 or request.top_k > 20:
        raise HTTPException(status_code=400, detail="top_k must be between 1 and 20 for RAG")
    
    try:
        # Search for relevant chunks
        search_results = search_similar_chunks(request.query, request.top_k)
        
        if not search_results:
            return RAGResponse(
                answer="No relevant documents found to answer this question. Please try a different query or upload more documents.",
                sources=[],
                query=request.query
            )
        
        # Generate answer
        answer = generate_rag_answer(request.query, search_results)
        
        print(f"✅ RAG generation completed for query: '{request.query}' - Used {len(search_results)} sources")
        
        return RAGResponse(
            answer=answer,
            sources=search_results,
            query=request.query
        )
        
    except Exception as e:
        print(f"❌ RAG generation error for query '{request.query}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating RAG answer: {str(e)}")

@app.get("/documents")
async def list_documents():
    """List all indexed documents"""
    try:
        all_metadata = collection.get()["metadatas"]
        if not all_metadata:
            return {"documents": [], "total": 0}
        
        unique_files = list(set([meta["filename"] for meta in all_metadata]))
        return {"documents": unique_files, "total": len(unique_files)}
        
    except Exception as e:
        print(f"❌ Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Delete a document and all its chunks"""
    try:
        # Get all chunks for this document
        results = collection.get(
            where={"filename": filename}
        )
        
        if results["ids"]:
            collection.delete(ids=results["ids"])
            print(f"✅ Successfully deleted document: {filename}")
            return {"message": f"Document {filename} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
            
    except Exception as e:
        print(f"❌ Error deleting document {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main web interface"""
    return templates.TemplateResponse("index.html", {"request": {}})

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "sentence_transformer": sentence_model is not None,
            "chromadb": chroma_client is not None,
            "gemini_api": gemini_model is not None
        }
    }

if __name__ == "__main__":
    os.makedirs(VECTOR_DB_PATH, exist_ok=True)
    # Configure for public access
    HOST = "0.0.0.0"  # Allow external connections
    PORT = 8000
    
    print(f"🚀 Starting PDF Semantic Search & RAG Service...")
    print(f"📍 Local Access: http://localhost:{PORT}")
    print(f"🌐 Public Access: http://YOUR_IP_ADDRESS:{PORT}")
    print(f"🔧 API Documentation: http://localhost:{PORT}/docs")
    print(f"📊 Health Check: http://localhost:{PORT}/health")
    print(f"⚠️  Make sure your firewall allows connections on port {PORT}")
    
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
