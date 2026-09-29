"""Build an installable theme ZIP with store-specific integrations reset."""
from pathlib import Path
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist' / 'dunamiss-reusable-theme.zip'
FOLDERS = ('assets', 'blocks', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates')
RESET = ('mid', 'ga4Gokwik', 'gkAdsConfig', 'fbpixel', 'mapbox_public_token')
removed_apps = 0


def read_json(text):
    # Preserve commas inside settings strings while accepting Shopify JSONC.
    text = re.sub(r'^\s*/\*.*?\*/\s*', '', text, count=1, flags=re.S)
    output = []
    quoted = escaped = False
    for index, char in enumerate(text):
        if quoted:
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char == '"':
                quoted = False
        elif char == '"':
            quoted = True
        elif char == ',':
            tail = text[index + 1:].lstrip()
            if tail.startswith(('}', ']')):
                continue
        output.append(char)
    return json.loads(''.join(output))


def remove_app_blocks(value):
    global removed_apps
    if isinstance(value, dict):
        blocks = value.get('blocks')
        if isinstance(blocks, dict):
            removed = [key for key, block in blocks.items()
                       if isinstance(block, dict) and str(block.get('type', '')).startswith('shopify://apps/')]
            for key in removed:
                del blocks[key]
            removed_apps += len(removed)
            if isinstance(value.get('block_order'), list):
                value['block_order'] = [key for key in value['block_order'] if key not in removed]
        for key, child in list(value.items()):
            if key in ('purchase_code', 'purchase_code_action'):
                del value[key]
            else:
                remove_app_blocks(child)
    elif isinstance(value, list):
        for child in value:
            remove_app_blocks(child)


OUTPUT.parent.mkdir(exist_ok=True)
count = 0
with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as archive:
    for folder in FOLDERS:
        for path in sorted((ROOT / folder).rglob('*')):
            if not path.is_file() or path.name.startswith('.'):
                continue
            relative = path.relative_to(ROOT).as_posix()
            data = path.read_bytes()
            if path.suffix == '.json' and folder in ('config', 'sections', 'templates'):
                value = read_json(data.decode('utf-8'))
                if relative == 'config/settings_data.json':
                    current = value.get('current', {})
                    if not isinstance(current, dict):
                        current = dict(value.get('presets', {}).get(current, {}))
                    for key in RESET:
                        current[key] = ''
                    current.update(goEnable=False, goBuynowEnable=False, envType='production')
                    value = {'current': current, 'presets': {}}
                remove_app_blocks(value)
                data = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
            archive.writestr(relative, data)
            count += 1
with zipfile.ZipFile(OUTPUT) as archive:
    assert archive.testzip() is None
    settings = json.loads(archive.read('config/settings_data.json'))['current']
    assert settings['goEnable'] is False and settings['goBuynowEnable'] is False
    assert all(settings.get(key) == '' for key in RESET)
print(f'Created {OUTPUT.name}: {count} theme files; removed {removed_apps} store-specific app blocks.')
