import base64, sys, re, os

site_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(site_dir, 'index.html')
png_path  = os.path.join(site_dir, 'chord_selector_screenshot.png')

with open(html_path) as f:
    html = f.read()

with open(png_path, 'rb') as f:
    raw = f.read()

b64  = base64.b64encode(raw).decode()
mime = 'image/jpeg' if raw[:2] == b'\xff\xd8' else 'image/png'
src  = f'data:{mime};base64,{b64}'

html_out = html.replace('src="chord_selector_screenshot.png"', f'src="{src}"')

out_path = os.path.join(site_dir, 'index_deploy.html')
with open(out_path, 'w') as f:
    f.write(html_out)

print(f'OK: {len(html_out)} chars, {mime}')
