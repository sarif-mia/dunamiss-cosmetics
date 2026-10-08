"""Run fast, deterministic checks for the Dunamiss Shopify theme."""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
THEME_FOLDERS = ("assets", "blocks", "config", "layout", "locales", "sections", "snippets", "templates")
LIQUID_FOLDERS = ("blocks", "layout", "sections", "snippets", "templates")
JSON_FOLDERS = ("config", "content", "locales", "templates")
SHOPIFY_JSON_COMMENT = re.compile(r"^\s*/\*.*?\*/\s*", re.DOTALL)
LIQUID_COMMENT = re.compile(r"{%\s*comment\s*%}.*?{%\s*endcomment\s*%}", re.DOTALL)
HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)


class Audit:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.counts: dict[str, int] = {}

    def error(self, message: str) -> None:
        self.errors.append(message)

    def count(self, name: str, amount: int = 1) -> None:
        self.counts[name] = self.counts.get(name, 0) + amount


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT))


def source_without_comments(text: str) -> str:
    return HTML_COMMENT.sub("", LIQUID_COMMENT.sub("", text))


def nested_strings(value: object):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from nested_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from nested_strings(item)


def json_source(path: Path) -> str:
    return SHOPIFY_JSON_COMMENT.sub("", path.read_text(encoding="utf-8-sig"), count=1)


def validate_json(audit: Audit) -> None:
    for folder in JSON_FOLDERS:
        for path in sorted((ROOT / folder).rglob("*.json")):
            source = json_source(path)
            try:
                json.loads(source)
                audit.count("JSON files")
            except json.JSONDecodeError as error:
                audit.error(f"{relative(path)}:{error.lineno}:{error.colno}: invalid JSON: {error.msg}")


def validate_schema_json(audit: Audit) -> None:
    schema_pattern = re.compile(r"{%\s*schema\s*%}(.*?){%\s*endschema\s*%}", re.DOTALL)
    for folder in ("blocks", "sections"):
        for path in sorted((ROOT / folder).rglob("*.liquid")):
            source = path.read_text()
            schemas = schema_pattern.findall(source)
            if len(schemas) > 1:
                audit.error(f"{relative(path)}: contains more than one schema block")
            for schema in schemas:
                try:
                    json.loads(schema)
                    audit.count("schema blocks")
                except json.JSONDecodeError as error:
                    audit.error(f"{relative(path)}: invalid schema JSON: {error.msg} at {error.lineno}:{error.colno}")


def validate_javascript(audit: Audit) -> None:
    for path in sorted((ROOT / "assets").glob("*.js")):
        result = subprocess.run(("node", "--check", str(path)), capture_output=True, text=True)
        if result.returncode:
            detail = next((line for line in reversed(result.stderr.splitlines()) if line.strip()), "syntax error")
            audit.error(f"{relative(path)}: JavaScript syntax failed: {detail}")
        else:
            audit.count("JavaScript files")


def validate_references(audit: Audit) -> None:
    asset_pattern = re.compile(r"['\"]([^'\"]+)['\"]\s*\|\s*asset_url")
    render_pattern = re.compile(r"{%[-\s]*(?:render|include)\s+['\"]([^'\"]+)['\"]")
    section_pattern = re.compile(r"{%[-\s]*section\s+['\"]([^'\"]+)['\"]")
    referenced_assets: set[str] = set()

    def check_source(path: Path, source: str) -> None:
        for asset in asset_pattern.findall(source):
            referenced_assets.add(asset)
            if not (ROOT / "assets" / asset).is_file():
                audit.error(f"{relative(path)}: missing asset: assets/{asset}")
            else:
                audit.count("asset references")
        for snippet in render_pattern.findall(source):
            if not (ROOT / "snippets" / f"{snippet}.liquid").is_file():
                audit.error(f"{relative(path)}: missing snippet: snippets/{snippet}.liquid")
            else:
                audit.count("snippet references")
        for section in section_pattern.findall(source):
            if not (ROOT / "sections" / f"{section}.liquid").is_file():
                audit.error(f"{relative(path)}: missing section: sections/{section}.liquid")
            else:
                audit.count("section references")

    for folder in LIQUID_FOLDERS:
        for path in sorted((ROOT / folder).rglob("*.liquid")):
            check_source(path, source_without_comments(path.read_text()))

    for path in sorted((ROOT / "templates").glob("*.json")):
        for value in nested_strings(json.loads(json_source(path))):
            if "{%" in value:
                check_source(path, source_without_comments(value))

    for path in sorted((ROOT / "assets").glob("dunamiss-*")):
        if path.suffix in {".css", ".js"} and path.name not in referenced_assets:
            audit.error(f"{relative(path)}: custom runtime asset is not referenced")


def validate_link_safety(audit: Audit) -> None:
    anchor_pattern = re.compile(r"<a\b[^>]*>", re.IGNORECASE | re.DOTALL)
    blank_pattern = re.compile(r"\btarget\s*=\s*['\"]_blank['\"]", re.IGNORECASE)
    rel_pattern = re.compile(r"\brel\s*=", re.IGNORECASE)
    javascript_pattern = re.compile(r"\bhref\s*=\s*['\"]javascript:", re.IGNORECASE)

    for folder in LIQUID_FOLDERS:
        for path in sorted((ROOT / folder).rglob("*.liquid")):
            source = source_without_comments(path.read_text())
            for anchor in anchor_pattern.finditer(source):
                tag = anchor.group(0)
                line = source.count("\n", 0, anchor.start()) + 1
                if blank_pattern.search(tag) and not rel_pattern.search(tag):
                    audit.error(f"{relative(path)}:{line}: target=_blank link needs rel=noopener")
                if javascript_pattern.search(tag):
                    audit.error(f"{relative(path)}:{line}: replace javascript: link with a button or plain content")
                audit.count("links")


def validate_generated_css(audit: Audit) -> None:
    module_path = ROOT / "scripts" / "build-storefront-css.py"
    spec = importlib.util.spec_from_file_location("build_storefront_css", module_path)
    if spec is None or spec.loader is None:
        audit.error("scripts/build-storefront-css.py: could not load build module")
        return
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    expected = {
        ROOT / "assets" / "dunamiss-global.css": module.build_global(),
        ROOT / "assets" / "dunamiss-foundations.css": module.build_foundations(),
    }
    for path, output in expected.items():
        if not path.is_file() or path.read_text() != output:
            audit.error(f"{relative(path)}: generated CSS is stale; run python3 scripts/build-storefront-css.py")
        else:
            audit.count("generated CSS files")


def validate_translations(audit: Audit) -> None:
    def keys(value: object, prefix: str = "", include_containers: bool = False) -> set[str]:
        output: set[str] = set()
        if isinstance(value, dict):
            for name, item in value.items():
                path = f"{prefix}.{name}" if prefix else name
                if include_containers:
                    output.add(path)
                output.update(keys(item, path, include_containers))
        elif prefix:
            output.add(prefix)
        return output

    storefront_path = ROOT / "locales" / "en.default.json"
    schema_path = ROOT / "locales" / "en.default.schema.json"
    storefront_data = json.loads(json_source(storefront_path))
    schema_data = json.loads(json_source(schema_path))
    storefront_keys = keys(storefront_data, include_containers=True)
    schema_keys = keys(schema_data, include_containers=True)
    translation_pattern = re.compile(r"['\"]([A-Za-z0-9_.-]+)['\"]\s*\|\s*t\b")
    referenced: set[str] = set()

    for folder in LIQUID_FOLDERS:
        for path in sorted((ROOT / folder).rglob("*.liquid")):
            source = source_without_comments(path.read_text())
            for name in translation_pattern.findall(source):
                referenced.add(name)
                if name not in storefront_keys:
                    audit.error(f"{relative(path)}: missing default translation: {name}")

    for path in sorted((ROOT / "templates").glob("*.json")):
        for value in nested_strings(json.loads(json_source(path))):
            for name in translation_pattern.findall(value):
                referenced.add(name)
                if name not in storefront_keys:
                    audit.error(f"{relative(path)}: missing default translation: {name}")

    schema_values: list[tuple[Path, object]] = [
        (ROOT / "config" / "settings_schema.json", json.loads(json_source(ROOT / "config" / "settings_schema.json")))
    ]
    schema_pattern = re.compile(r"{%\s*schema\s*%}(.*?){%\s*endschema\s*%}", re.DOTALL)
    for folder in ("blocks", "sections"):
        for path in sorted((ROOT / folder).rglob("*.liquid")):
            match = schema_pattern.search(path.read_text())
            if match:
                schema_values.append((path, json.loads(match.group(1))))
    for path, value in schema_values:
        for text in nested_strings(value):
            if text.startswith("t:") and text[2:] not in schema_keys:
                audit.error(f"{relative(path)}: missing default schema translation: {text[2:]}")

    default_leaf_keys = keys(storefront_data)
    for path in sorted((ROOT / "locales").glob("*.json")):
        if path.name == "en.default.json" or path.name.endswith(".schema.json"):
            continue
        locale_keys = keys(json.loads(json_source(path)))
        missing = sorted(default_leaf_keys - locale_keys)
        extra = sorted(locale_keys - default_leaf_keys)
        if missing or extra:
            audit.error(
                f"{relative(path)}: translation keys differ from en.default.json "
                f"({len(missing)} missing, {len(extra)} extra)"
            )

    audit.count("translation references", len(referenced))
    audit.count("matching translated locales", len(list((ROOT / "locales").glob("*.json"))) - 2)


def validate_tracked_files(audit: Audit) -> None:
    result = subprocess.run(("git", "ls-files"), cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        audit.error("git ls-files failed")
        return
    forbidden = re.compile(r"(^|/)(?:\.DS_Store|settings_data\.json|\.env(?:\..*)?)$")
    for name in result.stdout.splitlines():
        if forbidden.search(name) or name.startswith("reports/"):
            audit.error(f"{name}: local or sensitive file must not be tracked")


def main() -> int:
    audit = Audit()
    missing_folders = [folder for folder in THEME_FOLDERS if not (ROOT / folder).is_dir()]
    for folder in missing_folders:
        audit.error(f"{folder}/: required theme directory is missing")

    validate_json(audit)
    validate_schema_json(audit)
    validate_javascript(audit)
    validate_references(audit)
    validate_link_safety(audit)
    validate_generated_css(audit)
    validate_translations(audit)
    validate_tracked_files(audit)

    if audit.errors:
        print(f"FAIL: {len(audit.errors)} issue(s) found")
        for error in audit.errors:
            print(f"- {error}")
        return 1

    detail = ", ".join(f"{count} {name}" for name, count in sorted(audit.counts.items()))
    print(f"PASS: theme audit completed ({detail}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
