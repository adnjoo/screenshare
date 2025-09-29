const { app, BrowserWindow, ipcMain, desktopCapturer, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

let mainWindow;
let recordingWindow;
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let outputPath = '';
let ffmpegProcess = null;
let recordingStartTime = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'hiddenInset',
    resizable: false,
    minimizable: true,
    maximizable: false,
    show: false
  });

  mainWindow.loadFile('src/renderer/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createRecordingOverlay() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  recordingWindow = new BrowserWindow({
    width: 300,
    height: 100,
    x: width - 320,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  recordingWindow.loadFile('src/renderer/recording-overlay.html');
  recordingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

// IPC handlers
ipcMain.handle('get-screen-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 150, height: 150 }
    });
    return sources;
  } catch (error) {
    console.error('Error getting screen sources:', error);
    return [];
  }
});

ipcMain.handle('start-recording', async (event, sourceId) => {
  try {
    // Check if we have screen recording permissions
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 150, height: 150 }
    });
    
    const source = sources.find(s => s.id === sourceId);
    if (!source) {
      return { success: false, error: 'Selected source not found' };
    }
    
    // Check if FFmpeg is available
    if (!ffmpegPath) {
      return { success: false, error: 'FFmpeg not found. Please install FFmpeg.' };
    }
    
    isRecording = true;
    recordingStartTime = Date.now();
    
    // Show recording overlay
    createRecordingOverlay();
    
    // Create video recording file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    outputPath = path.join(process.cwd(), `recording-${timestamp}.mp4`);
    
    // Get screen dimensions and ensure even numbers for H.264
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const evenWidth = Math.floor(width / 2) * 2;
    const evenHeight = Math.floor(height / 2) * 2;
    
    // Start FFmpeg screen recording with better macOS compatibility
    const ffmpegArgs = [
      '-f', 'avfoundation',           // Use AVFoundation on macOS
      '-capture_cursor', '1',         // Capture cursor
      '-capture_mouse_clicks', '1',   // Capture mouse clicks
      '-i', '1:0',                    // Screen input (1) and audio input (0)
      '-r', '30',                     // Frame rate
      '-s', `${evenWidth}x${evenHeight}`, // Screen size (even numbers)
      '-c:v', 'libx264',             // Video codec
      '-preset', 'ultrafast',        // Encoding preset
      '-crf', '23',                  // Quality
      '-pix_fmt', 'yuv420p',         // Pixel format
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
      '-c:a', 'aac',                 // Audio codec
      '-b:a', '128k',                // Audio bitrate
      '-movflags', '+faststart',      // Optimize for streaming
      '-y',                           // Overwrite output file
      outputPath
    ];
    
    console.log('Starting FFmpeg with args:', ffmpegArgs);
    
    ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    ffmpegProcess.stdout.on('data', (data) => {
      console.log('FFmpeg stdout:', data.toString());
    });
    
    ffmpegProcess.stderr.on('data', (data) => {
      console.log('FFmpeg stderr:', data.toString());
    });
    
    ffmpegProcess.on('close', (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
      if (code === 0 || code === 255) { // 255 is normal for SIGTERM
        console.log('Recording completed successfully');
      } else {
        console.error('FFmpeg process failed, trying fallback method...');
        // Try fallback method with different parameters
        startFallbackRecording(evenWidth, evenHeight, outputPath);
      }
    });
    
    ffmpegProcess.on('error', (error) => {
      console.error('FFmpeg process error:', error);
    });
    
    console.log(`Video recording started: ${outputPath}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error starting recording:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-recording', async () => {
  if (isRecording && ffmpegProcess) {
    try {
      isRecording = false;
      
      // Close recording overlay
      if (recordingWindow) {
        recordingWindow.close();
        recordingWindow = null;
      }
      
      // Stop FFmpeg process
      if (ffmpegProcess && !ffmpegProcess.killed) {
        ffmpegProcess.kill('SIGTERM');
        
        // Wait a moment for graceful shutdown
        setTimeout(() => {
          if (ffmpegProcess && !ffmpegProcess.killed) {
            ffmpegProcess.kill('SIGKILL');
          }
        }, 2000);
      }
      
      // Calculate recording duration
      const duration = recordingStartTime ? Date.now() - recordingStartTime : 0;
      const durationSeconds = Math.round(duration / 1000);
      
      console.log(`Video recording stopped: ${outputPath}`);
      console.log(`Recording duration: ${durationSeconds} seconds`);
      
      // Wait a moment for file to be written, then notify
      setTimeout(() => {
        if (outputPath && fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          console.log(`Video file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          mainWindow.webContents.send('recording-saved', outputPath);
        }
      }, 1000);
      
      return { success: true };
    } catch (error) {
      console.error('Error stopping recording:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false };
});

ipcMain.handle('pause-recording', async () => {
  if (isRecording && ffmpegProcess) {
    try {
      // Send pause signal to FFmpeg
      ffmpegProcess.kill('SIGSTOP');
      console.log('Recording paused');
      return { success: true };
    } catch (error) {
      console.error('Error pausing recording:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false };
});

ipcMain.handle('resume-recording', async () => {
  if (isRecording && ffmpegProcess) {
    try {
      // Send resume signal to FFmpeg
      ffmpegProcess.kill('SIGCONT');
      console.log('Recording resumed');
      return { success: true };
    } catch (error) {
      console.error('Error resuming recording:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false };
});

ipcMain.handle('get-recording-status', () => {
  return { isRecording };
});

function startFallbackRecording(width, height, outputPath) {
  console.log('Starting fallback recording method...');
  
  // Try a simpler approach without audio first
  const fallbackArgs = [
    '-f', 'avfoundation',
    '-capture_cursor', '1',
    '-i', '1',  // Screen only, no audio
    '-r', '30',
    '-s', `${width}x${height}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-y',
    outputPath
  ];
  
  ffmpegProcess = spawn(ffmpegPath, fallbackArgs, {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  ffmpegProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Fallback recording completed successfully');
    } else {
      console.error('Fallback recording also failed');
    }
  });
}

function convertToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .on('end', () => {
        console.log('Conversion finished');
        resolve();
      })
      .on('error', (err) => {
        console.error('Conversion error:', err);
        reject(err);
      })
      .run();
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
