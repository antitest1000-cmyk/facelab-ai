"""FaceLab AI root entrypoint for direct deployment platforms."""
import os
import sys
from pathlib import Path

# Ensure backend package is in python search path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting FaceLab AI on {host}:{port} (1 worker)...")
    uvicorn.run("backend.app.main:app", host=host, port=port, workers=1)
