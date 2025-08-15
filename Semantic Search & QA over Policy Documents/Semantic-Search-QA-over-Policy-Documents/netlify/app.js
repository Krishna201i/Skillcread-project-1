// Netlify-Compatible PDF Semantic Search & RAG Service
// This is a demo version that works without a backend

class NetlifyPDFService {
    constructor() {
        this.currentMode = 'search';
        this.documents = [];
        this.searchCount = 0;
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.updateStats();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // File upload handling
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Auto-search on typing
        let typingTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                if (searchInput.value.trim()) {
                    this.performSearch();
                }
            }, 1000);
        });
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            this.showAlert('Please select PDF files only.', 'warning');
            return;
        }

        this.showLoading(true);
        
        try {
            for (const file of pdfFiles) {
                await this.processPDFFile(file);
            }
            
            this.showAlert(`Successfully processed ${pdfFiles.length} PDF file(s)!`, 'success');
            this.updateStats();
            
        } catch (error) {
            this.showAlert('Error processing files: ' + error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    async processPDFFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Simulate PDF processing (in real app, this would send to backend)
                    const document = {
                        filename: file.name,
                        size: file.size,
                        chunks: Math.floor(file.size / 1000) + 1, // Simulate chunks
                        content: 'PDF content would be extracted here...',
                        timestamp: new Date().toISOString()
                    };
                    
                    this.documents.push(document);
                    resolve(document);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update content
        const searchTitle = document.getElementById('searchTitle');
        const searchDescription = document.getElementById('searchDescription');
        const searchInput = document.getElementById('searchInput');
        
        if (mode === 'search') {
            searchTitle.textContent = 'Semantic Search';
            searchDescription.textContent = 'Find relevant content in your documents';
            searchInput.placeholder = 'Enter your search query...';
        } else {
            searchTitle.textContent = 'AI Answers (RAG)';
            searchDescription.textContent = 'Ask questions and get AI-powered answers';
            searchInput.placeholder = 'Ask a question about your documents...';
        }
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        
        if (!query) {
            this.showAlert('Please enter a search query.', 'warning');
            return;
        }
        
        if (this.documents.length === 0) {
            this.showAlert('Please upload some PDF documents first.', 'warning');
            return;
        }

        this.showLoading(true);
        this.searchCount++;
        
        try {
            // Simulate search delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            let results;
            if (this.currentMode === 'search') {
                results = this.simulateSearch(query);
            } else {
                results = this.simulateRAG(query);
            }
            
            this.displayResults(results, query);
            this.updateStats();
            
        } catch (error) {
            this.showAlert('Search error: ' + error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    simulateSearch(query) {
        // Simulate semantic search results - NOW SHOWING ALL RESULTS
        const results = [];
        const keywords = query.toLowerCase().split(' ');
        
        this.documents.forEach((doc, index) => {
            // Generate multiple results per document to simulate comprehensive search
            const numResults = Math.floor(Math.random() * 3) + 1; // 1-3 results per document
            
            for (let i = 0; i < numResults; i++) {
                const relevance = Math.random() * 0.8 + 0.2; // Random relevance score
                
                results.push({
                    content: `This is search result ${i + 1} from ${doc.filename}. The query "${query}" was found with relevance score ${relevance.toFixed(3)}. This represents a comprehensive search that shows every possible outcome.`,
                    filename: doc.filename,
                    similarity_score: relevance,
                    chunk_index: Math.floor(Math.random() * doc.chunks) + 1,
                    result_number: i + 1
                });
            }
        });
        
        // Sort by relevance but show ALL results
        results.sort((a, b) => b.similarity_score - a.similarity_score);
        
        // Return ALL results instead of limiting to top 5
        return results;
    }

    simulateRAG(query) {
        // Simulate RAG response with ALL relevant documents
        const relevantDocs = this.documents; // Use ALL documents instead of just first 3
        
        const answer = `Based on ALL uploaded documents, here's what I found regarding "${query}":\n\n` +
            relevantDocs.map((doc, i) => 
                `Document ${i + 1} (${doc.filename}): This document contains relevant information about your question. ` +
                `The content suggests that ${query} is an important topic covered in this material. ` +
                `This comprehensive search covers every single document in your collection.`
            ).join('\n\n') +
            `\n\nThis is a simulated AI response that covers ALL documents. In a real implementation, this would be generated using ` +
            `actual document content and advanced language models, providing complete coverage of your document collection.`;
        
        return {
            answer: answer,
            sources: relevantDocs.map((doc, i) => ({
                content: `Relevant content from ${doc.filename}`,
                filename: doc.filename,
                similarity_score: 0.8 - (i * 0.05) // Smaller decrement to show more results
            }))
        };
    }

    displayResults(results, query) {
        const resultsDiv = document.getElementById('results');
        
        if (this.currentMode === 'search') {
            this.displaySearchResults(results, query);
        } else {
            this.displayRAGResults(results, query);
        }
    }

    displaySearchResults(results, query) {
        const resultsDiv = document.getElementById('results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No relevant results found for "${query}". Try different keywords or upload more documents.
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="search-section">
                <h4><i class="fas fa-search me-2"></i>Search Results for "${query}"</h4>
                <p class="text-muted">Found ${results.length} comprehensive results (showing ALL possible outcomes)</p>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Comprehensive Search:</strong> This search shows every single possible result from your documents, not just the top matches.
                </div>
        `;
        
        results.forEach((result, index) => {
            html += `
                <div class="results-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0">
                            <i class="fas fa-file-pdf me-2"></i>${result.filename}
                        </h6>
                        <div>
                            <span class="badge bg-primary me-2">Score: ${result.similarity_score.toFixed(3)}</span>
                            <span class="badge bg-secondary">Result #${result.result_number}</span>
                        </div>
                    </div>
                    <p class="mb-2">${result.content}</p>
                    <small class="text-muted">
                        <i class="fas fa-layer-group me-1"></i>Chunk ${result.chunk_index} | 
                        <i class="fas fa-list-ol me-1"></i>Result ${index + 1} of ${results.length}
                    </small>
                </div>
            `;
        });
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    }

    displayRAGResults(results, query) {
        const resultsDiv = document.getElementById('results');
        
        let html = `
            <div class="search-section">
                <h4><i class="fas fa-robot me-2"></i>AI Answer for "${query}"</h4>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Comprehensive RAG:</strong> This response covers ALL documents in your collection.
                </div>
                <div class="results-card">
                    <div class="mb-3">
                        <h6><i class="fas fa-lightbulb me-2"></i>Answer:</h6>
                        <p class="mb-0">${results.answer.replace(/\n/g, '<br>')}</p>
                    </div>
                    <hr>
                    <div>
                        <h6><i class="fas fa-sources me-2"></i>Sources (${results.sources.length} documents):</h6>
                        ${results.sources.map(source => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span><i class="fas fa-file-pdf me-2"></i>${source.filename}</span>
                                <span class="badge bg-secondary">Score: ${source.similarity_score.toFixed(3)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.style.display = show ? 'block' : 'none';
    }

    showAlert(message, type) {
        const alertsDiv = document.getElementById('alerts');
        const alertId = 'alert-' + Date.now();
        
        const alert = `
            <div class="alert alert-${type} alert-dismissible fade show" id="${alertId}">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" onclick="document.getElementById('${alertId}').remove()"></button>
            </div>
        `;
        
        alertsDiv.innerHTML = alert;
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'danger': 'times-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    updateStats() {
        document.getElementById('docCount').textContent = this.documents.length;
        document.getElementById('chunkCount').textContent = this.documents.reduce((sum, doc) => sum + doc.chunks, 0);
        document.getElementById('searchCount').textContent = this.searchCount;
    }

    showWelcomeMessage() {
        this.showAlert('Welcome to PDF Semantic Search & RAG! Upload some PDFs to get started.', 'info');
    }

    showInfo() {
        alert(`PDF Semantic Search & RAG Service (Netlify Demo Version)

This is a demonstration version that works on Netlify.

Features:
✅ Beautiful, responsive UI
✅ Drag & drop PDF upload
✅ COMPREHENSIVE semantic search (shows ALL results)
✅ Complete RAG responses (covers ALL documents)
✅ Modern dark theme
✅ No result limits - see everything!

Note: This demo version simulates the AI functionality.
For full functionality, you would need a backend server.

Built with ❤️ for Netlify deployment!`);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pdfService = new NetlifyPDFService();
});

// Global functions for HTML onclick handlers
function setMode(mode) {
    window.pdfService.setMode(mode);
}

function performSearch() {
    window.pdfService.performSearch();
}

function showInfo() {
    window.pdfService.showInfo();
}
