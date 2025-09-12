import os
import time
import json
import ctypes
from datetime import datetime
from ctypes import byref, c_int, c_uint, c_ubyte, c_char_p, c_void_p

# ===== Configuration =====
DLL_NAME = "SynoAPIEx.dll"
DEFAULT_ADDR = 0xFFFFFFFF
CAPTURE_TIMEOUT = 15  # Shorter timeout for web interface

# File paths for communication - go up one level from python_service
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)  # Go up one level to project root
COMM_DIR = os.path.join(PROJECT_ROOT, "communication")

REQUEST_FLAG = os.path.join(COMM_DIR, "capture_request.flag")
STATUS_FILE = os.path.join(COMM_DIR, "status.json")
IMAGE_FILE = os.path.join(COMM_DIR, "latest_capture.bmp")
ERROR_LOG = os.path.join(COMM_DIR, "error.log")

# Create communication directory
os.makedirs(COMM_DIR, exist_ok=True)

# ===== Load DLL =====
def load_vendor_dll(name: str) -> ctypes.CDLL:
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        candidate = os.path.join(here, name)
        return ctypes.WinDLL(candidate if os.path.isfile(candidate) else name)
    except OSError as e:
        raise SystemExit(f"Failed to load {name}: {e}")

dll = load_vendor_dll(DLL_NAME)

# ===== DLL Setup =====
HANDLE = c_void_p
DEVICE_USB, DEVICE_COM, DEVICE_UDISK = 0, 1, 2
PS_OK, PS_COMM_ERR, PS_NO_FINGER = 0x00, 0x01, 0x02
IMAGE_X, IMAGE_Y = 256, 288
IMAGE_BYTES = IMAGE_X * IMAGE_Y

# Function signatures
dll.PSAutoOpen.argtypes = [ctypes.POINTER(HANDLE), ctypes.POINTER(c_int), c_int, c_uint, c_int]
dll.PSAutoOpen.restype = c_int
dll.PSCloseDeviceEx.argtypes = [HANDLE]
dll.PSCloseDeviceEx.restype = c_int
dll.PSGetImage.argtypes = [HANDLE, c_int]
dll.PSGetImage.restype = c_int
dll.PSUpImage.argtypes = [HANDLE, c_int, ctypes.POINTER(c_ubyte), ctypes.POINTER(c_int)]
dll.PSUpImage.restype = c_int
dll.PSImgData2BMP.argtypes = [ctypes.POINTER(c_ubyte), c_char_p]
dll.PSImgData2BMP.restype = c_int
dll.PSErr2Str.argtypes = [c_int]
dll.PSErr2Str.restype = ctypes.c_char_p

def err_text(code: int) -> str:
    s = dll.PSErr2Str(code)
    return s.decode(errors="ignore") if s else f"Error 0x{code:02X}"

# ===== Status Management =====
def update_status(status: str, message: str = "", error: str = None):
    """Update status file for frontend communication."""
    status_data = {
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "image_path": IMAGE_FILE if status == "success" else None,
        "error": error
    }
    
    try:
        with open(STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)
    except Exception as e:
        log_error(f"Failed to update status: {e}")

def log_error(error_msg: str):
    """Log errors to error file."""
    try:
        with open(ERROR_LOG, 'a') as f:
            f.write(f"{datetime.now().isoformat()}: {error_msg}\n")
    except:
        pass  # Silently fail if can't log

# ===== Device Operations =====
def open_device() -> HANDLE:
    """Open fingerprint device."""
    h = HANDLE()
    dtype = c_int(-1)
    rc = dll.PSAutoOpen(byref(h), byref(dtype), DEFAULT_ADDR, 0, 1)
    
    if rc != PS_OK or not h:
        raise RuntimeError(f"Device open failed: {err_text(rc)}")
    
    return h

def close_device(h: HANDLE):
    """Close fingerprint device."""
    if h:
        dll.PSCloseDeviceEx(h)

def capture_fingerprint(h: HANDLE) -> bytes:
    """Capture fingerprint image."""
    # Wait for finger with timeout
    start_time = time.time()
    while True:
        rc = dll.PSGetImage(h, DEFAULT_ADDR)
        if rc == PS_OK:
            break
        if rc == PS_NO_FINGER:
            if time.time() - start_time > CAPTURE_TIMEOUT:
                raise TimeoutError("No finger detected within timeout")
            time.sleep(0.2)
            continue
        raise RuntimeError(f"Capture failed: {err_text(rc)}")
    
    # Upload image data
    img_buf = (c_ubyte * IMAGE_BYTES)()
    img_len = c_int(IMAGE_BYTES)
    rc = dll.PSUpImage(h, DEFAULT_ADDR, img_buf, byref(img_len))
    
    if rc != PS_OK:
        raise RuntimeError(f"Image upload failed: {err_text(rc)}")
    
    return bytes(bytearray(img_buf)[:img_len.value])

def save_fingerprint_image(img_bytes: bytes):
    """Save fingerprint as BMP file."""
    buf = (c_ubyte * len(img_bytes)).from_buffer_copy(img_bytes)
    rc = dll.PSImgData2BMP(buf, IMAGE_FILE.encode("utf-8"))
    
    if rc != PS_OK:
        raise RuntimeError(f"Image save failed: {err_text(rc)}")

# ===== Main Service Loop =====
def cleanup_old_files():
    """Clean up old communication files."""
    files_to_clean = [REQUEST_FLAG, IMAGE_FILE]
    for file_path in files_to_clean:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass

def process_capture_request(h: HANDLE):
    """Process a single capture request."""
    try:
        # Remove request flag
        os.remove(REQUEST_FLAG)
        
        # Update status to capturing
        update_status("capturing", "Place finger on sensor now...")
        
        # Capture fingerprint
        img_bytes = capture_fingerprint(h)
        
        # Save image
        save_fingerprint_image(img_bytes)
        
        # Update status to success
        update_status("success", "Fingerprint captured successfully!")
        
    except TimeoutError as e:
        update_status("error", str(e), "timeout")
        log_error(f"Capture timeout: {e}")
        
    except Exception as e:
        update_status("error", f"Capture failed: {e}", "capture_error")
        log_error(f"Capture error: {e}")

def main():
    """Main service loop."""
    print("=" * 60)
    print("FINGERPRINT SERVICE - File-Based Communication")
    print("=" * 60)
    print(f"Communication directory: {os.path.abspath(COMM_DIR)}")
    print("Service starting...")
    
    # Cleanup old files
    cleanup_old_files()
    
    # Initialize status
    update_status("initializing", "Starting fingerprint device...")
    
    h = None
    try:
        # Open device
        h = open_device()
        update_status("ready", "Service ready. Waiting for capture requests...")
        print("Device opened successfully. Service is ready.")
        print("Monitoring for capture requests... (Press Ctrl+C to stop)")
        
        # Main service loop
        while True:
            try:
                # Check for capture request
                if os.path.exists(REQUEST_FLAG):
                    print("Capture request detected. Processing...")
                    process_capture_request(h)
                    print("Capture request completed.")
                
                # Small delay to avoid busy waiting
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                break
                
            except Exception as e:
                log_error(f"Service loop error: {e}")
                print(f"Service error: {e}")
                time.sleep(1)  # Wait before continuing
    
    except Exception as e:
        error_msg = f"Device initialization failed: {e}"
        update_status("error", error_msg, "device_error")
        print(error_msg)
        log_error(error_msg)
    
    finally:
        if h:
            close_device(h)
        update_status("stopped", "Service stopped")
        print("Service stopped.")

if __name__ == "__main__":
    main()