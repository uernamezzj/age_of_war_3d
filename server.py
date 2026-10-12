import os
import sys
import mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PORT = 8089
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('application/octet-stream', '.fbx')
mimetypes.add_type('application/octet-stream', '.blend')
mimetypes.add_type('model/gltf-binary', '.glb')
mimetypes.add_type('model/gltf+json', '.gltf')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')

class CORSHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.end_headers()

    def log_message(self, format, *args):
        # Concise logging
        sys.stdout.write(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

def run():
    os.chdir(ROOT_DIR)
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadingHTTPServer(server_address, CORSHTTPRequestHandler)
    print(f"Age of War 3D Server running at http://localhost:{PORT}/")
    print(f"Serving directory: {ROOT_DIR}")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()

if __name__ == '__main__':
    run()
