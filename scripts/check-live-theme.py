#!/usr/bin/env python3
"""Compare the local theme with live Shopify source without overwriting local files."""
import argparse
import datetime
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
THEME_DIRS = ('assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates')
STORE = 'cfe991.myshopify.com'
LIVE_THEME = 'live'


def theme_files(root):
    return {str(p.relative_to(root)): p for folder in THEME_DIRS
            for p in (root / folder).rglob('*') if p.is_file()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', type=Path, help='Compare an existing Shopify CLI pull instead of downloading again.')
    args = parser.parse_args()
    if args.snapshot:
        snapshot = args.snapshot.resolve()
    else:
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
        snapshot = ROOT / 'reports' / 'live-theme-sync' / stamp
        snapshot.mkdir(parents=True)
        result = subprocess.run([
            'npx', '@shopify/cli@latest', 'theme', 'pull', '--store', STORE,
            '--live', '--path', str(snapshot)
        ], cwd=ROOT)
        if result.returncode:
            return result.returncode
    if not (snapshot / 'layout' / 'theme.liquid').is_file():
        print('Snapshot is incomplete: layout/theme.liquid is missing.', file=sys.stderr)
        return 2
    live = theme_files(snapshot)
    local = theme_files(ROOT)
    report = {
        'store': STORE, 'live_theme': LIVE_THEME, 'snapshot': str(snapshot),
        'live_file_count': len(live), 'local_file_count': len(local),
        'different': sorted(p for p in live.keys() & local.keys()
                            if live[p].read_bytes() != local[p].read_bytes()),
        'only_live': sorted(live.keys() - local.keys()),
        'only_local': sorted(local.keys() - live.keys()),
    }
    report['matches_live'] = not any(report[k] for k in ('different', 'only_live', 'only_local'))
    output = ROOT / 'reports' / 'live-theme-parity.json'
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + '\n')
    if report['matches_live']:
        print(f'PASS: all {len(live)} local theme files match live byte for byte.')
        return 0
    print('Local theme differs from live. Review these files before pushing:')
    for key in ('different', 'only_live', 'only_local'):
        for filename in report[key]:
            print(f'  {key}: {filename}')
    print(f'Comparison saved to {output.relative_to(ROOT)}. Local files were not overwritten.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
