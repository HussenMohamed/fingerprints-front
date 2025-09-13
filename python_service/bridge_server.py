import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes

class FingerprintBridgeHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.project_root = os.path.dirname(os.path.abspath(__file__))
        self.communication_dir = os.path.join(os.path.dirname(self.project_root), "communication")
        self.frontend_dir = os.path.join(os.path.dirname(self.project_root), "frontend-vue", "dist")
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
            
        elif path.startswith('/api/auth/verify'):
            # Verify authentication token
            self.verify_token()
            
        # elif path.startswith('/api/user/profile'):
        #     # Get user profile
        #     self.get_user_profile()
            
        # elif path.startswith('/api/user/login-history'):
        #     # Get user login history
        #     self.get_login_history()
            
        elif path.startswith('/api/admin/stats'):
            # Get system statistics
            self.get_system_stats()
            
        elif path.endswith('.css'):
            # Serve CSS files
            self.serve_file(os.path.join(self.frontend_dir, path.lstrip('/')))
            
        elif path.endswith('.js'):
            # Serve JavaScript files
            self.serve_file(os.path.join(self.frontend_dir, path.lstrip('/')))
            
        elif path.startswith('/assets/'):
            # Serve assets files
            self.serve_file(os.path.join(self.frontend_dir, path.lstrip('/')))
            
        else:
            # For all other routes, serve index.html (SPA routing)
            index_path = os.path.join(self.frontend_dir, "index.html")
            if os.path.exists(index_path):
                self.serve_file(index_path)
            else:
                self.send_error(404, "File not found")
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/trigger-scan':
            # Create capture request flag
            self.trigger_scan()
        # elif path == '/api/auth/login':
        #     # Handle login fingerprint authentication
        #     self.handle_login()
        # elif path == '/api/auth/register':
        #     # Handle user registration
        #     self.handle_registration()
        # elif path == '/api/auth/logout':
        #     # Handle user logout
        #     self.handle_logout()
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
    
    def handle_login(self):
        """Handle login authentication with fingerprint"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
            else:
                request_data = {}
            
            # Mock authentication logic
            # In a real implementation, this would compare the fingerprint
            # with stored fingerprints in the database
            
            # For demo purposes, simulate authentication
            import random
            success = random.random() > 0.3  # 70% success rate
            
            if success:
                response = {
                    "success": True,
                    "message": "Authentication successful",
                    "user": {
                        "id": "user123",
                        "name": "Demo User",
                        "email": "demo@example.com"
                    },
                    "token": "mock-jwt-token-12345"
                }
            else:
                response = {
                    "success": False,
                    "message": "Fingerprint not recognized",
                    "error": "authentication_failed"
                }
            
            response_json = json.dumps(response)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
            print(f"Login attempt: {'Success' if success else 'Failed'}")
            
        except Exception as e:
            print(f"Error handling login: {e}")
            self.send_error(500, "Login processing failed")
    
    def handle_registration(self):
        """Handle user registration with multiple fingerprints"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
            else:
                request_data = {}
            
            # Mock registration logic
            # In a real implementation, this would save user data and fingerprints
            # to the database
            
            user_details = request_data.get('userDetails', {})
            fingerprints = request_data.get('fingerprints', [])
            
            # Simulate processing delay
            import time
            time.sleep(1)
            
            # Mock successful registration
            response = {
                "success": True,
                "message": "Registration successful",
                "user": {
                    "id": f"user_{int(time.time())}",
                    "name": user_details.get('fullName', ''),
                    "email": user_details.get('email', ''),
                    "department": user_details.get('department', ''),
                    "fingerprintsCount": len(fingerprints),
                    "registrationDate": time.strftime('%Y-%m-%d %H:%M:%S')
                }
            }
            
            response_json = json.dumps(response)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
            print(f"Registration completed for: {user_details.get('fullName', 'Unknown')}")
            
        except Exception as e:
            print(f"Error handling registration: {e}")
            self.send_error(500, "Registration processing failed")
    
    def handle_logout(self):
        """Handle user logout"""
        try:
            response = {
                "success": True,
                "message": "Logout successful"
            }
            
            response_json = json.dumps(response)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
            print("User logged out")
            
        except Exception as e:
            print(f"Error handling logout: {e}")
            self.send_error(500, "Logout processing failed")
    
    def verify_token(self):
        """Verify authentication token"""
        try:
            # Extract token from Authorization header
            auth_header = self.headers.get('Authorization', '')
            token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else None
            
            if token and token == 'mock-jwt-token-12345':  # Mock token validation
                response = {
                    "valid": True,
                    "user": {
                        "id": "user123",
                        "name": "Demo User",
                        "email": "demo@example.com"
                    }
                }
            else:
                response = {
                    "valid": False,
                    "message": "Invalid or expired token"
                }
            
            response_json = json.dumps(response)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"Error verifying token: {e}")
            self.send_error(500, "Token verification failed")
    
    def get_user_profile(self):
        """Get user profile information"""
        try:
            # Mock user profile data
            profile = {
                "id": "user123",
                "name": "Demo User",
                "email": "demo@example.com",
                "department": "IT Security",
                "registrationDate": "2024-01-15",
                "lastLogin": "2024-01-20T10:30:00Z",
                "fingerprintsRegistered": 3,
                "loginCount": 42
            }
            
            response_json = json.dumps(profile)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"Error getting user profile: {e}")
            self.send_error(500, "Profile retrieval failed")
    
    def get_login_history(self):
        """Get user login history"""
        try:
            import time
            
            # Mock login history data
            history = {
                "loginHistory": [
                    {
                        "timestamp": "2024-01-20T10:30:00Z",
                        "success": True,
                        "ipAddress": "192.168.1.100",
                        "userAgent": "Mozilla/5.0..."
                    },
                    {
                        "timestamp": "2024-01-19T14:15:00Z", 
                        "success": True,
                        "ipAddress": "192.168.1.100",
                        "userAgent": "Mozilla/5.0..."
                    },
                    {
                        "timestamp": "2024-01-19T09:45:00Z",
                        "success": False,
                        "ipAddress": "192.168.1.100",
                        "userAgent": "Mozilla/5.0...",
                        "reason": "Fingerprint not recognized"
                    }
                ],
                "totalLogins": 42,
                "failedAttempts": 3,
                "lastLogin": "2024-01-20T10:30:00Z"
            }
            
            response_json = json.dumps(history)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"Error getting login history: {e}")
            self.send_error(500, "Login history retrieval failed")
    
    def get_system_stats(self):
        """Get system statistics (admin endpoint)"""
        try:
            import time
            
            # Mock system statistics
            stats = {
                "totalUsers": 156,
                "activeUsers": 89,
                "totalLogins": 1247,
                "todayLogins": 23,
                "failedAttempts": 45,
                "systemUptime": "15 days, 4 hours",
                "fingerprintCaptures": {
                    "today": 34,
                    "thisWeek": 287,
                    "thisMonth": 1156
                },
                "averageLoginTime": "2.3 seconds",
                "systemHealth": "Excellent"
            }
            
            response_json = json.dumps(stats)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"Error getting system stats: {e}")
            self.send_error(500, "System stats retrieval failed")
    
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
    print("  POST /api/auth/login - Authenticate user with fingerprint")
    print("  POST /api/auth/register - Register new user with fingerprints")
    print("  POST /api/auth/logout - User logout")
    print("  GET  /api/auth/verify - Verify authentication token")
    print("  GET  /api/user/profile - Get user profile")
    print("  GET  /api/user/login-history - Get login history")
    print("  GET  /api/admin/stats - Get system statistics")
    print("=" * 60)
    print("Press Ctrl+C to stop server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    main()