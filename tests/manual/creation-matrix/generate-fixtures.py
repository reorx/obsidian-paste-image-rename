"""Generate disposable test images only. Requires Pillow; no image decoding test."""
from PIL import Image
from pathlib import Path
import json,sys
p=Path(sys.argv[1])
Image.new('RGBA',(16384,2048),(10,80,240,255)).save(p/'Pasted image huge.png',compress_level=0)
Image.new('RGB',(1200,150),(240,80,10)).save(p/'Pasted image wide.webp')
fixtures={}
for name in ['Pasted image huge.png','Pasted image wide.webp']:
    with Image.open(p/name) as image:
        fixtures[name]={'width':image.width,'height':image.height,'size':(p/name).stat().st_size,'format':image.format}
(p/'fixtures.json').write_text(json.dumps(fixtures,indent=2))
