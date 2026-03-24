import os
import urllib.request
import urllib.error
import urllib.parse

SUPABASE_URL = "https://wjzxntgpuimiubrnqfnz.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZnhudHBndWltcXVicm5xZm56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDIwMDAwMDAwfQ.a52c6c61ada226a7bad2b6104be6e47515fad350dcc3a69c5ebc2c4cce21e3ce"

def upload_file(file_path, bucket, storage_path):
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{storage_path}"
    
    with open(file_path, 'rb') as f:
        content = f.read()
    
    content_type = "application/octet-stream"
    if file_path.endswith('.html'):
        content_type = "text/html"
    elif file_path.endswith('.css'):
        content_type = "text/css"
    elif file_path.endswith('.js'):
        content_type = "application/javascript"
    elif file_path.endswith('.svg'):
        content_type = "image/svg+xml"
    elif file_path.endswith('.ico'):
        content_type = "image/x-icon"
    elif file_path.endswith('.txt'):
        content_type = "text/plain"
    
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"
    }
    
    try:
        req = urllib.request.Request(url, data=content, headers=headers, method='POST')
        r = urllib.request.urlopen(req)
        print(f"{file_path} -> {r.status}")
        return True
    except urllib.error.HTTPError as e:
        print(f"{file_path} -> {e.code}: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"Error uploading {file_path}: {e}")
        return False

print("Uploading index.html...")
upload_file("dist/index.html", "site", "index.html")

assets_dir = "dist/assets"
if os.path.exists(assets_dir):
    for f in os.listdir(assets_dir):
        fpath = os.path.join(assets_dir, f)
        if os.path.isfile(fpath):
            upload_file(fpath, "site", f"assets/{f}")

for f in ["favicon.ico", "robots.txt", "placeholder.svg"]:
    fpath = os.path.join("dist", f)
    if os.path.exists(fpath):
        upload_file(fpath, "site", f)

print("\nDone!")
