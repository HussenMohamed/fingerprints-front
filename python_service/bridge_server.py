import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes

class FingerprintBridgeHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.project_root = os.path.dirname(os.path.abspath(__file__))
        self.communication_dir = os.path.join(os.path.dirname(self.project_root), "communication")
        self.frontend_dir = os.path.join(os.path.dirname(self.project_root), "frontend-vue")
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            # Serve the main HTML file
            self.serve_file(os.path.join(self.frontend_dir, "index.html"))
            
        elif path.startswith('/api/status'):
            # Return status.json content
            self.serve_status()
            
        elif path.startswith('/api/image'):
            # Return the latest captured image
            self.serve_image()
            
        elif path.endswith('.css'):
            # Serve CSS files
            self.serve_file(os.path.join(self.frontend_dir, path.lstrip('/')))
            
        elif path.endswith('.js'):
            # Serve JavaScript files
            self.serve_file(os.path.join(self.frontend_dir, path.lstrip('/')))
            
        else:
            self.send_error(404, "File not found")
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/trigger-scan':
            # Create capture request flag
            self.trigger_scan()
        else:
            self.send_error(404, "Endpoint not found")
    
    def serve_file(self, file_path):
        """Serve a static file"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Determine content type
                content_type, _ = mimetypes.guess_type(file_path)
                if content_type is None:
                    content_type = 'application/octet-stream'
                
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.add_cors_headers()
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_error(404, "File not found")
        except Exception as e:
            print(f"Error serving file {file_path}: {e}")
            self.send_error(500, "Internal server error")
    
    def serve_status(self):
        """Serve the current status from status.json"""
        try:
            status_file = os.path.join(self.communication_dir, "status.json")
            
            if os.path.exists(status_file):
                with open(status_file, 'r') as f:
                    status_data = json.load(f)
            else:
                # Default status if file doesn't exist
                status_data = {
                    "status": "error",
                    "message": "Service not running",
                    "timestamp": "",
                    "image_path": None,
                    "error": "status_file_missing"
                }
            
            response_json = json.dumps(status_data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"Error serving status: {e}")
            self.send_error(500, "Error reading status")
    
    def serve_image(self):
        """Serve the latest captured fingerprint image"""
        try:
            image_file = os.path.join(self.communication_dir, "latest_capture.bmp")
            
            if os.path.exists(image_file):
                with open(image_file, 'rb') as f:
                    image_data = f.read()
                
                self.send_response(200)
                self.send_header('Content-Type', 'image/bmp')
                self.send_header('Content-Length', str(len(image_data)))
                self.add_cors_headers()
                self.end_headers()
                self.wfile.write(image_data)
            else:
                self.send_error(404, "No image available")
                
        except Exception as e:
            print(f"Error serving image: {e}")
            self.send_error(500, "Error reading image")
    
    def trigger_scan(self):
        """Create capture request flag file"""
        try:
            flag_file = os.path.join(self.communication_dir, "capture_request.flag")
            
            # Create the flag file
            with open(flag_file, 'w') as f:
                f.write("")
            
            response = {"success": True, "message": "Scan triggered"}
            response_json = json.dumps(response)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
            print("Scan triggered via API")
            
        except Exception as e:
            print(f"Error triggering scan: {e}")
            self.send_error(500, "Failed to trigger scan")
    
    def add_cors_headers(self):
        """Add CORS headers for frontend compatibility"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # self.send_header('Connection', 'keep-alive')
        # self.send_header('Keep-Alive', 'timeout=5, max=100')
    
    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.add_cors_headers()
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{self.address_string()}] {format % args}")

def main():
    server_address = ('localhost', 8080)
    httpd = HTTPServer(server_address, FingerprintBridgeHandler)
    
    print("=" * 60)
    print("FINGERPRINT BRIDGE SERVER")
    print("=" * 60)
    print(f"Server running on http://localhost:8080")
    print("Frontend accessible at: http://localhost:8080")
    print("API endpoints:")
    print("  GET  /api/status  - Get scanner status")
    print("  GET  /api/image   - Get latest fingerprint image") 
    print("  POST /api/trigger-scan - Trigger fingerprint capture")
    print("=" * 60)
    print("Press Ctrl+C to stop server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    main()