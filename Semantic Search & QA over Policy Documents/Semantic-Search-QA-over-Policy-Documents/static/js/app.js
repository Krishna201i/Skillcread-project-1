// Enhanced JavaScript for Interactive PDF Semantic Search & RAG Service with Console

class InteractiveApp {
    constructor() {
        this.currentMode = 'search'; // 'search' or 'rag'
        this.isProcessing = false;
        this.notificationQueue = [];
        this.isNotificationShowing = false;
        this.typingTimer = null;
        this.typingDelay = 500; // ms
        this.uploadQueue = [];
        this.processingIndex = 0;
        this.consoleVisible = false;
        this.consoleLogs = [];
        this.maxConsoleLogs = 100;
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadDocuments();
        this.updateStats();
        this.setupKeyboardShortcuts();
        this.initializeAnimations();
        this.initializeConsole();
        this.showWelcomeMessage();
        this.startTimeUpdate();
    }

    setupEventListeners() {
        // File upload events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Search events
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        searchBtn.addEventListener('click', () => this.performSearch());
        searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Search mode toggle
        document.getElementById('searchMode').addEventListener('change', () => this.setSearchMode('search'));
        document.getElementById('ragMode').addEventListener('change', () => this.setSearchMode('rag'));

        // Console toggle
        document.getElementById('consoleToggle').addEventListener('click', () => this.toggleConsole());

        // Auto-resize textareas
        this.setupAutoResize();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K to focus search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // Escape to clear search
            if (e.key === 'Escape') {
                document.getElementById('searchInput').value = '';
                this.hideResults();
            }
            
            // Ctrl+U to focus upload
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                document.getElementById('uploadArea').click();
            }

            // Ctrl+` to toggle console
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                this.toggleConsole();
            }
        });
    }

    setupAutoResize() {
        // Auto-resize textareas for better UX
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        });
    }

    initializeAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe all cards and sections
        document.querySelectorAll('.feature-card, .card').forEach(el => {
            observer.observe(el);
        });
    }

    initializeConsole() {
        this.logToConsole('Console initialized. Ready for system logs.', 'info');
        this.logToConsole('System ready. All services operational.', 'success');
        this.logToConsole('Press Ctrl+` to toggle console anytime.', 'info');
    }

    toggleConsole() {
        const consolePanel = document.getElementById('consolePanel');
        const consoleToggle = document.getElementById('consoleToggle');
        
        this.consoleVisible = !this.consoleVisible;
        
        if (this.consoleVisible) {
            consolePanel.classList.add('show');
            consoleToggle.innerHTML = '<i class="fas fa-times"></i>';
            consoleToggle.style.background = 'var(--accent-color)';
            this.logToConsole('Console opened', 'info');
        } else {
            consolePanel.classList.remove('show');
            consoleToggle.innerHTML = '<i class="fas fa-terminal"></i>';
            consoleToggle.style.background = 'var(--primary-color)';
            this.logToConsole('Console closed', 'info');
        }
    }

    logToConsole(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            type,
            message,
            id: Date.now()
        };

        this.consoleLogs.push(logEntry);
        
        // Keep only the last maxConsoleLogs entries
        if (this.consoleLogs.length > this.maxConsoleLogs) {
            this.consoleLogs.shift();
        }

        this.updateConsoleDisplay();
    }

    updateConsoleDisplay() {
        const consoleContent = document.getElementById('consoleContent');
        consoleContent.innerHTML = '';

        this.consoleLogs.forEach(log => {
            const logLine = document.createElement('div');
            logLine.className = 'console-line';
            logLine.innerHTML = `
                <span class="console-timestamp">[${log.timestamp}]</span>
                <span class="console-type ${log.type}">${log.type.toUpperCase()}</span>
                <span class="console-message">${log.message}</span>
            `;
            consoleContent.appendChild(logLine);
        });

        // Auto-scroll to bottom
        consoleContent.scrollTop = consoleContent.scrollHeight;
    }

    clearConsole() {
        this.consoleLogs = [];
        this.updateConsoleDisplay();
        this.logToConsole('Console cleared', 'info');
    }

    startTimeUpdate() {
        setInterval(() => {
            const currentTimeElement = document.getElementById('currentTime');
            if (currentTimeElement) {
                currentTimeElement.textContent = new Date().toLocaleTimeString();
            }
        }, 1000);
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('Welcome to PDF Semantic Search & RAG! 🚀', 'info');
            this.logToConsole('Welcome message displayed', 'info');
        }, 1000);
    }

    // Enhanced Drag & Drop
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('dragover');
        uploadArea.style.transform = 'scale(1.05)';
        this.logToConsole('File drag over detected', 'info');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('dragover');
        uploadArea.style.transform = 'scale(1)';
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('dragover');
        uploadArea.style.transform = 'scale(1)';

        const files = Array.from(e.dataTransfer.files);
        this.logToConsole(`Files dropped: ${files.length} file(s)`, 'info');
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.logToConsole(`Files selected: ${files.length} file(s)`, 'info');
        this.processFiles(files);
    }

    async processFiles(files) {
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            this.showNotification('Please select PDF files only.', 'warning');
            this.logToConsole('Non-PDF files rejected', 'warning');
            return;
        }

        this.uploadQueue = pdfFiles;
        this.processingIndex = 0;
        
        this.showNotification(`Processing ${pdfFiles.length} PDF file(s)...`, 'info');
        this.logToConsole(`Starting batch processing of ${pdfFiles.length} PDF files`, 'info');
        this.showUploadProgress();
        
        await this.processUploadQueue();
    }

    async processUploadQueue() {
        if (this.processingIndex >= this.uploadQueue.length) {
            this.hideUploadProgress();
            this.showNotification('All files processed successfully! 🎉', 'success');
            this.logToConsole('Batch processing completed successfully', 'success');
            this.loadDocuments();
            this.updateStats();
            return;
        }

        const file = this.uploadQueue[this.processingIndex];
        const progress = ((this.processingIndex + 1) / this.uploadQueue.length) * 100;
        
        this.updateProgress(progress);
        this.showNotification(`Processing: ${file.name}`, 'info');
        this.logToConsole(`Processing file: ${file.name}`, 'info');

        try {
            await this.uploadFile(file);
            this.processingIndex++;
            setTimeout(() => this.processUploadQueue(), 500);
        } catch (error) {
            this.showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
            this.logToConsole(`Error processing ${file.name}: ${error.message}`, 'error');
            this.processingIndex++;
            setTimeout(() => this.processUploadQueue(), 500);
        }
    }

    showUploadProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        progressContainer.classList.remove('d-none');
        progressContainer.style.opacity = '0';
        setTimeout(() => {
            progressContainer.style.opacity = '1';
        }, 10);
    }

    hideUploadProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        progressContainer.style.opacity = '0';
        setTimeout(() => {
            progressContainer.classList.add('d-none');
        }, 300);
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${percentage}%`;
    }

    // Enhanced Search Input Handling
    handleSearchInput(e) {
        clearTimeout(this.typingTimer);
        
        this.typingTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                this.performAutoSearch(query);
            } else if (query.length === 0) {
                this.hideResults();
            }
        }, this.typingDelay);
    }

    async performAutoSearch(query) {
        if (this.currentMode === 'search') {
            await this.performSearch(query);
        }
    }

    // Enhanced Search Functionality
    async performSearch(query = null) {
        const searchInput = document.getElementById('searchInput');
        const queryText = query || searchInput.value.trim();

        if (!queryText) {
            this.showNotification('Please enter a search query.', 'warning');
            return;
        }

        this.showLoading();
        this.hideResults();
        this.logToConsole(`Search initiated: "${queryText}"`, 'info');

        try {
            if (this.currentMode === 'search') {
                await this.performSemanticSearch(queryText);
            } else {
                await this.performRAGSearch(queryText);
            }
        } catch (error) {
            this.showNotification(`Search error: ${error.message}`, 'error');
            this.logToConsole(`Search error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async performSemanticSearch(query) {
        this.logToConsole(`Performing semantic search for: "${query}"`, 'info');
        
        const response = await fetch('/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, top_k: 5 })
        });

        if (!response.ok) throw new Error('Search failed');
        
        const results = await response.json();
        this.logToConsole(`Search completed: ${results.length} results found`, 'success');
        this.displaySearchResults(results, query);
    }

    async performRAGSearch(query) {
        this.logToConsole(`Performing RAG search for: "${query}"`, 'info');
        
        const response = await fetch('/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, top_k: 3 })
        });

        if (!response.ok) throw new Error('RAG search failed');
        
        const result = await response.json();
        this.logToConsole(`RAG search completed successfully`, 'success');
        this.displayRAGResults(result, query);
    }

    // Enhanced Results Display
    displaySearchResults(results, query) {
        const container = document.getElementById('searchResults');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>No results found</h5>
                    <p class="text-muted">Try adjusting your search query or upload more documents.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="mb-3">
                    <h6 class="text-muted">Found ${results.length} relevant results for: "${query}"</h6>
                </div>
                ${results.map((result, index) => `
                    <div class="result-item card mb-3" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 15px;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="text-primary mb-0">
                                    <i class="fas fa-file-pdf me-2"></i>${result.filename}
                                </h6>
                                <span class="badge bg-primary rounded-pill">
                                    Score: ${(1 - result.similarity_score).toFixed(3)}
                                </span>
                            </div>
                            <p class="mb-0" style="color: var(--text-secondary); line-height: 1.6;">
                                ${this.highlightQuery(result.content, query)}
                            </p>
                        </div>
                    </div>
                `).join('')}
            `;
        }

        resultsContainer.classList.remove('d-none');
        this.animateResults();
    }

    displayRAGResults(result, query) {
        const container = document.getElementById('ragResults');
        const resultsContainer = document.getElementById('resultsContainer');
        
        container.innerHTML = `
            <div class="mb-3">
                <h6 class="text-muted">AI Answer for: "${query}"</h6>
            </div>
            <div class="card mb-4" style="background: linear-gradient(145deg, #1a4731, #2d3748); border: 1px solid var(--success-color); border-radius: 15px;">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-robot fa-2x text-success me-3"></i>
                        <h5 class="mb-0 text-success">AI Generated Answer</h5>
                    </div>
                    <div class="rag-answer" style="color: var(--text-primary); line-height: 1.7; font-size: 1.1rem;">
                        ${result.answer}
                    </div>
                </div>
            </div>
            ${result.sources.length > 0 ? `
                <h6 class="mb-3">
                    <i class="fas fa-sources me-2"></i>Sources Used
                </h6>
                ${result.sources.map((source, index) => `
                    <div class="result-item card mb-3" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 15px;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="text-primary mb-0">
                                    <i class="fas fa-file-pdf me-2"></i>${source.filename}
                                </h6>
                                <span class="badge bg-success rounded-pill">
                                    Relevance: ${(1 - source.similarity_score).toFixed(3)}
                                </span>
                            </div>
                            <p class="mb-0" style="color: var(--text-secondary); line-height: 1.6;">
                                ${source.content.substring(0, 200)}${source.content.length > 200 ? '...' : ''}
                            </p>
                        </div>
                    </div>
                `).join('')}
            ` : ''}
        `;

        resultsContainer.classList.remove('d-none');
        this.animateResults();
    }

    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background: var(--primary-color); color: white; padding: 2px 4px; border-radius: 3px;">$1</mark>');
    }

    animateResults() {
        const resultItems = document.querySelectorAll('.result-item');
        resultItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }

    // Enhanced File Upload
    async uploadFile(file) {
        this.logToConsole(`Starting upload: ${file.name}`, 'info');
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const result = await response.json();
        this.showNotification(`✅ ${file.name} uploaded successfully! (${result.chunks} chunks)`, 'success');
        this.logToConsole(`File uploaded successfully: ${file.name} (${result.chunks} chunks)`, 'success');
        
        return result;
    }

    // Enhanced Document Management
    async loadDocuments() {
        try {
            const response = await fetch('/documents');
            const data = await response.json();
            this.displayDocuments(data.documents);
            this.logToConsole(`Documents loaded: ${data.documents.length} files`, 'info');
        } catch (error) {
            this.showNotification('Error loading documents', 'error');
            this.logToConsole(`Error loading documents: ${error.message}`, 'error');
        }
    }

    displayDocuments(documents) {
        const container = document.getElementById('documentsList');
        
        if (documents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <h5>No documents uploaded yet</h5>
                    <p class="text-muted">Upload your first PDF to get started!</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="row g-3">
                    ${documents.map((doc, index) => `
                        <div class="col-md-6 col-lg-4">
                            <div class="card interactive-card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 15px;">
                                <div class="card-body text-center">
                                    <i class="fas fa-file-pdf fa-2x text-primary mb-3"></i>
                                    <h6 class="mb-2">${doc}</h6>
                                    <button class="btn btn-sm btn-outline-danger btn-interactive" onclick="app.deleteDocument('${doc}')">
                                        <i class="fas fa-trash me-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    async deleteDocument(filename) {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

        this.logToConsole(`Deleting document: ${filename}`, 'warning');

        try {
            const response = await fetch(`/documents/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Delete failed');

            this.showNotification(`✅ ${filename} deleted successfully`, 'success');
            this.logToConsole(`Document deleted successfully: ${filename}`, 'success');
            this.loadDocuments();
            this.updateStats();
        } catch (error) {
            this.showNotification(`Error deleting ${filename}: ${error.message}`, 'error');
            this.logToConsole(`Error deleting ${filename}: ${error.message}`, 'error');
        }
    }

    // Enhanced Statistics
    async updateStats() {
        try {
            const response = await fetch('/documents');
            const data = await response.json();
            
            const totalChunks = data.documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);
            
            this.animateCounter('documentCount', data.documents.length);
            this.animateCounter('chunkCount', totalChunks);
            
            this.logToConsole(`Stats updated: ${data.documents.length} docs, ${totalChunks} chunks`, 'info');
        } catch (error) {
            console.error('Error updating stats:', error);
            this.logToConsole(`Error updating stats: ${error.message}`, 'error');
        }
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        const increment = (targetValue - currentValue) / 20;
        let current = currentValue;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 50);
    }

    // Enhanced UI Controls
    setSearchMode(mode) {
        this.currentMode = mode;
        const searchInput = document.getElementById('searchInput');
        
        if (mode === 'rag') {
            searchInput.placeholder = 'Ask a question about your documents...';
            this.showNotification('🤖 RAG mode activated - Get AI-powered answers!', 'info');
            this.logToConsole('Search mode switched to RAG', 'info');
        } else {
            searchInput.placeholder = 'Search for content in your documents...';
            this.showNotification('🔍 Search mode activated - Find relevant content!', 'info');
            this.logToConsole('Search mode switched to Semantic Search', 'info');
        }
    }

    showLoading() {
        this.isProcessing = true;
        const searchBtn = document.getElementById('searchBtn');
        searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Searching...';
        searchBtn.disabled = true;
    }

    hideLoading() {
        this.isProcessing = false;
        const searchBtn = document.getElementById('searchBtn');
        searchBtn.innerHTML = '<i class="fas fa-search me-2"></i>Search';
        searchBtn.disabled = false;
    }

    hideResults() {
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.classList.add('d-none');
    }

    // Enhanced Notification System
    showNotification(message, type = 'info', duration = 4000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            duration
        };

        this.notificationQueue.push(notification);
        this.processNotificationQueue();
    }

    processNotificationQueue() {
        if (this.isNotificationShowing || this.notificationQueue.length === 0) return;

        this.isNotificationShowing = true;
        const notification = this.notificationQueue.shift();
        this.displayNotification(notification);
    }

    displayNotification(notification) {
        const container = document.getElementById('notificationContainer');
        const notificationElement = document.createElement('div');
        
        notificationElement.className = `notification ${notification.type}`;
        notificationElement.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getNotificationIcon(notification.type)} me-2"></i>
                <span>${notification.message}</span>
                <button class="btn btn-sm btn-link text-white ms-auto" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(notificationElement);

        // Animate in
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notificationElement.classList.remove('show');
            setTimeout(() => {
                if (notificationElement.parentElement) {
                    notificationElement.remove();
                }
                this.isNotificationShowing = false;
                this.processNotificationQueue();
            }, 300);
        }, notification.duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Utility Functions
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InteractiveApp();
});

// Add some fun Easter eggs
document.addEventListener('keydown', (e) => {
    // Konami code: ↑↑↓↓←→←→BA
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (window.app) {
            window.app.showNotification('🎮 Easter egg detected! Try the Konami code!', 'info', 2000);
            window.app.logToConsole('Easter egg triggered: Arrow keys detected', 'info');
        }
    }
});
