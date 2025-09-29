const { ipcRenderer } = require('electron');

class ScreenShareApp {
    constructor() {
        this.selectedSource = null;
        this.isRecording = false;
        this.recordings = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadScreenSources();
        this.loadRecordings();
    }

    initializeElements() {
        this.sourceGrid = document.getElementById('sourceGrid');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.recordingsList = document.getElementById('recordingsList');
        this.qualitySelect = document.getElementById('qualitySelect');
        this.fpsSelect = document.getElementById('fpsSelect');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.pauseBtn.addEventListener('click', () => this.pauseRecording());
        this.resumeBtn.addEventListener('click', () => this.resumeRecording());

        // Listen for recording status updates
        ipcRenderer.on('recording-saved', (event, filePath) => {
            this.onRecordingSaved(filePath);
        });
    }

    async loadScreenSources() {
        try {
            const sources = await ipcRenderer.invoke('get-screen-sources');
            this.displaySources(sources);
        } catch (error) {
            console.error('Error loading screen sources:', error);
            this.showError('Failed to load screen sources. Please check screen recording permissions.');
        }
    }

    displaySources(sources) {
        this.sourceGrid.innerHTML = '';
        
        sources.forEach(source => {
            const sourceItem = document.createElement('div');
            sourceItem.className = 'source-item';
            sourceItem.innerHTML = `
                <img src="${source.thumbnail.toDataURL()}" alt="${source.name}" class="source-thumbnail">
                <div class="source-name">${source.name}</div>
            `;
            
            sourceItem.addEventListener('click', () => {
                this.selectSource(source);
            });
            
            this.sourceGrid.appendChild(sourceItem);
        });
    }

    selectSource(source) {
        // Remove previous selection
        document.querySelectorAll('.source-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        event.currentTarget.classList.add('selected');
        this.selectedSource = source;
        
        // Enable start button
        this.startBtn.disabled = false;
    }

    async startRecording() {
        if (!this.selectedSource) {
            this.showError('Please select a screen or window to record.');
            return;
        }

        try {
            this.startBtn.disabled = true;
            this.startBtn.textContent = 'Starting...';
            
            const result = await ipcRenderer.invoke('start-recording', this.selectedSource.id);
            
            if (result.success) {
                this.isRecording = true;
                this.updateRecordingUI();
                this.showRecordingStatus();
            } else {
                this.showError(result.error || 'Failed to start recording');
                this.startBtn.disabled = false;
                this.startBtn.innerHTML = '<span class="btn-icon">▶️</span> Start Recording';
            }
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to start recording. Please check permissions.');
            this.startBtn.disabled = false;
            this.startBtn.innerHTML = '<span class="btn-icon">▶️</span> Start Recording';
        }
    }

    async stopRecording() {
        try {
            const result = await ipcRenderer.invoke('stop-recording');
            
            if (result.success) {
                this.isRecording = false;
                this.updateRecordingUI();
                this.hideRecordingStatus();
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showError('Failed to stop recording');
        }
    }

    async pauseRecording() {
        try {
            const result = await ipcRenderer.invoke('pause-recording');
            
            if (result.success) {
                this.pauseBtn.disabled = true;
                this.resumeBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error pausing recording:', error);
        }
    }

    async resumeRecording() {
        try {
            const result = await ipcRenderer.invoke('resume-recording');
            
            if (result.success) {
                this.pauseBtn.disabled = false;
                this.resumeBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error resuming recording:', error);
        }
    }

    updateRecordingUI() {
        if (this.isRecording) {
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.pauseBtn.disabled = false;
            this.resumeBtn.disabled = true;
        } else {
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.pauseBtn.disabled = true;
            this.resumeBtn.disabled = true;
            this.startBtn.innerHTML = '<span class="btn-icon">▶️</span> Start Recording';
        }
    }

    showRecordingStatus() {
        this.recordingStatus.classList.add('show');
    }

    hideRecordingStatus() {
        this.recordingStatus.classList.remove('show');
    }

    onRecordingSaved(filePath) {
        this.loadRecordings();
        const fileName = filePath.split('/').pop();
        this.showSuccess(`Video recording saved: ${fileName}`);
    }

    loadRecordings() {
        // In a real app, you'd load from a database or file system
        // For now, we'll just show a placeholder
        this.recordingsList.innerHTML = '<p class="no-recordings">No recordings yet</p>';
    }

    showError(message) {
        // Simple error display - in a real app you'd use a proper notification system
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success display - in a real app you'd use a proper notification system
        alert(`Success: ${message}`);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScreenShareApp();
});
