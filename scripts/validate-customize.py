"""Validate native editor controls and their template wiring without dependencies."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_json(path):
    return json.loads(re.sub(r"^/\*.*?\*/\s*", "", path.read_text(), flags=re.S))


schemas = {}
for path in (ROOT / "sections").glob("*.liquid"):
    match = re.search(r"{%\s*schema\s*%}(.*?){%\s*endschema\s*%}", path.read_text(), re.S)
    if match:
        schemas[path.stem] = json.loads(match[1])


def validate_values(values, fields, location):
    ids = [field["id"] for field in fields if "id" in field]
    assert len(ids) == len(set(ids)), f"Duplicate setting IDs: {location}"
    assert not set(values) - set(ids), f"Unknown settings in {location}: {set(values) - set(ids)}"


checked = 0
for path in list((ROOT / "templates").rglob("*.json")) + list((ROOT / "sections").glob("*-group.json")):
    data = read_json(path)
    sections = data.get("sections", {})
    assert len(sections) <= 25, f"Too many sections: {path}"
    assert len(data.get("order", [])) == len(set(data.get("order", []))), f"Duplicate order IDs: {path}"
    assert set(data.get("order", [])) <= sections.keys(), f"Missing ordered sections: {path}"
    for section_id, section in sections.items():
        section_type = section["type"]
        assert section_type in {"apps", "_blocks"} or (ROOT / "sections" / (section_type + ".liquid")).exists(), f"Missing section: {section_type}"
        blocks = section.get("blocks", {})
        assert len(blocks) <= 50, f"Too many blocks: {path}/{section_id}"
        order = section.get("block_order", [])
        assert len(order) == len(set(order)), f"Duplicate block order IDs: {path}/{section_id}"
        assert set(order) <= blocks.keys(), f"Missing ordered blocks: {path}/{section_id}"
        # Strictly validate the controls changed in this migration. Original Glozin
        # templates contain obsolete saved settings that Shopify ignores.
        if not section_type.startswith("dunamiss-") and section_type not in {"main-product", "main-collection-product"}:
            continue
        schema = schemas[section_type]
        if section_type.startswith("dunamiss-"):
            validate_values(section.get("settings", {}), schema.get("settings", []), section_type)
        types = {block["type"]: block for block in schema.get("blocks", [])}
        for block_id, block in blocks.items():
            if block["type"].startswith("shopify://"):
                continue
            assert block["type"] in types, f"Missing block schema: {section_type}/{block['type']}"
            if section_type.startswith("dunamiss-") or block["type"].startswith("dm_"):
                validate_values(block.get("settings", {}), types[block["type"]].get("settings", []), f"{section_type}/{block_id}")
        checked += 1

for section_type, schema in schemas.items():
    if not section_type.startswith("dunamiss-"):
        continue
    assert len(schema["name"]) <= 25, f"Section name too long: {section_type}"
    for block in schema.get("blocks", []):
        assert len(block["name"]) <= 25, f"Block name too long: {section_type}/{block['type']}"
        validate_values({}, block.get("settings", []), section_type + "/" + block["type"])

assert not list((ROOT / "templates").glob("page*.liquid")), "Legacy pages still bypass the theme editor"
print(f"Customize validation passed: {checked} template sections; native controls and page templates are connected.")
