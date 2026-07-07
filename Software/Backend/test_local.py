import sys
import os
sys.path.append(os.getcwd())
from app.services.gemini_service import LocalProvider
import base64

try:
    with open('test.jpg', 'wb') as f:
        f.write(b'fake_image_data')
    provider = LocalProvider()
    print('Testing extract_project_from_image...')
    # Dummy base64 1 pixel white gif
    dummy_img = 'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs='
    res = provider.extract_project_from_image(dummy_img)
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
