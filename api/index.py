import sys
import os

# Add the project root to the python path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Import the FastAPI app
from main import app

# This is required for Vercel to find the app
__all__ = ["app"]
