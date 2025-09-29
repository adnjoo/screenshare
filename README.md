# ScreenShare - Open Source Screen Recording App for Mac

A modern, open-source screen recording application for macOS built with Electron, similar to Screen Studio. Record your screen with high quality and export to various formats.

## Features

- 🎥 **High-Quality Screen Recording** - Record your entire screen or specific windows
- 🎨 **Modern UI** - Beautiful, intuitive interface with macOS design principles
- ⏯️ **Recording Controls** - Start, stop, pause, and resume recordings
- 📱 **Live Recording Overlay** - See recording status with timer
- 🎬 **Multiple Export Formats** - Export to MP4, WebM, and more
- ⚙️ **Customizable Settings** - Adjust quality, frame rate, and more
- 🔒 **Privacy Focused** - All recordings stay on your device

## Screenshots

The app features a clean, modern interface with:
- Source selection grid showing available screens and windows
- Recording controls with start/stop/pause/resume functionality
- Live recording indicator with timer
- Settings panel for quality and frame rate adjustment
- Recent recordings list

## Installation

### Prerequisites

- macOS 10.14 or later
- Node.js 16 or later
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd screenshare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

### Building for Distribution

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Create a distributable package**
   ```bash
   npm run dist
   ```

## Usage

### First Time Setup

1. **Grant Permissions**: When you first run the app, macOS will ask for screen recording permissions. Click "Allow" to enable screen recording.

2. **Select Recording Source**: Choose from available screens or windows in the main interface.

3. **Configure Settings**: Adjust quality and frame rate settings as needed.

### Recording

1. **Start Recording**: Click the "Start Recording" button after selecting a source
2. **Recording Overlay**: A small overlay will appear showing recording status and timer
3. **Control Recording**: Use pause/resume buttons to control the recording
4. **Stop Recording**: Click "Stop Recording" to finish and save the recording

### Export Options

Recordings are automatically saved as MP4 files in the app's directory. You can:
- Find recordings in the "Recent Recordings" section
- Open recordings directly from the app
- Access saved files in the file system

## Permissions Required

The app requires the following macOS permissions:
- **Screen Recording**: To capture screen content
- **Camera** (optional): For future webcam integration
- **Microphone** (optional): For future audio recording
- **File System Access**: To save recordings

## Technical Details

### Architecture

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Electron (Node.js)
- **Video Processing**: FFmpeg for video conversion
- **Screen Capture**: Electron's desktopCapturer API

### File Structure

```
screenshare/
├── src/
│   ├── main.js                 # Main Electron process
│   └── renderer/
│       ├── index.html          # Main UI
│       ├── styles.css          # Styling
│       ├── renderer.js         # Frontend logic
│       └── recording-overlay.html # Recording indicator
├── assets/                     # App icons and resources
├── package.json               # Dependencies and scripts
├── Info.plist                # macOS permissions
└── README.md                 # This file
```

### Dependencies

- **electron**: Cross-platform desktop app framework
- **fluent-ffmpeg**: Video processing and conversion
- **ffmpeg-static**: Static FFmpeg binaries

## Development

### Running in Development Mode

```bash
npm run dev
```

This runs the app with developer tools and hot reloading.

### Code Structure

- `src/main.js`: Main Electron process handling screen capture and recording
- `src/renderer/`: Frontend application files
- `src/renderer/renderer.js`: Main frontend logic and UI interactions

### Adding Features

The app is designed to be easily extensible. Key areas for enhancement:
- Audio recording integration
- Webcam overlay support
- Advanced editing features
- Cloud storage integration
- Real-time collaboration

## Troubleshooting

### Common Issues

1. **Screen Recording Permission Denied**
   - Go to System Preferences > Security & Privacy > Privacy > Screen Recording
   - Enable the app in the list

2. **Recording Quality Issues**
   - Adjust quality settings in the app
   - Ensure sufficient disk space
   - Close unnecessary applications

3. **App Won't Start**
   - Ensure Node.js is installed
   - Run `npm install` to install dependencies
   - Check console for error messages

### Performance Tips

- Close unnecessary applications before recording
- Use lower quality settings for longer recordings
- Ensure adequate disk space (recordings can be large)

## Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and standards
- Pull request process
- Issue reporting
- Feature requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Electron](https://electronjs.org/)
- Video processing powered by [FFmpeg](https://ffmpeg.org/)
- Inspired by Screen Studio and other modern screen recording tools

## Roadmap

- [ ] Audio recording support
- [ ] Webcam overlay integration
- [ ] Advanced editing features
- [ ] Cloud storage integration
- [ ] Real-time collaboration
- [ ] Mobile companion app
- [ ] Plugin system for extensions

---

**Note**: This is an open-source project. For commercial use or distribution, please review the license terms.
