# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a fingerprint authentication web application with a multi-component architecture:

### Core Components

1. **Python Fingerprint Service** (`python_service/`)
   - `fingerprint_service.py` - Main service daemon that interfaces with fingerprint hardware via `SynoAPIEx.dll`
   - `scanbmp.py` - Duplicate/alternative version of the fingerprint service
   - `bridge_server.py` - HTTP server (localhost:8080) that bridges frontend requests to the Python service
   - Hardware interface uses Windows DLL files (`SynoAPIEx.dll`, `IS.dll`)

2. **Web Frontend** (`frontend/`)
   - `index.html` - Main web interface for fingerprint scanning
   - `script.js` - Frontend controller with `FingerprintScanner` class
   - `style.css` - Responsive UI styling

3. **File-based Communication** (`communication/`)
   - `status.json` - Real-time status updates from Python service
   - `latest_capture.bmp` - Most recent fingerprint image
   - `capture_request.flag` - File flag to trigger scans
   - `error.log` - Service error logging

### Communication Flow

The system uses a file-based communication pattern:
1. Frontend creates `capture_request.flag` to trigger scans
2. Python service monitors for flag file and processes requests
3. Status updates flow through `status.json` with polling from frontend
4. Captured fingerprints are saved as BMP images for display/upload

### Service Management

**Start the full system:**
```bash
# Terminal 1: Start the Python fingerprint service
cd python_service
python fingerprint_service.py

# Terminal 2: Start the HTTP bridge server
cd python_service  
python bridge_server.py

# Access the web interface at: http://localhost:8080
```

**Alternative service (if main service has issues):**
```bash
cd python_service
python scanbmp.py
```

### Key Features

- Real-time fingerprint capture with 15-second timeout
- Web-based interface with status polling every 500ms during scans
- Image preview and upload capabilities
- Responsive design for various screen sizes
- Error handling and logging
- Support for both API-based and manual flag file triggering

### Development Notes

- The system is Windows-specific due to hardware DLL dependencies
- Frontend uses vanilla JavaScript with ES6 class syntax
- HTTP server serves static files and provides REST API endpoints
- File monitoring uses simple polling rather than filesystem events
- All communication directories and files are auto-created as needed

### Troubleshooting

- Check `communication/error.log` for service issues
- Verify `SynoAPIEx.dll` and `IS.dll` are present in `python_service/`
- Ensure fingerprint hardware is connected and drivers installed
- Monitor `communication/status.json` for real-time service status