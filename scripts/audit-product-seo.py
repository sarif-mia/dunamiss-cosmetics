"""Compare a native Shopify CSV export with a reviewed product-copy snapshot.

Reads files only. It never writes to Shopify or changes the catalogue.
"""
import argparse
import csv
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)


def text(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value or ""))).strip()


def links(value):
    parser = Links()
    parser.feed(value or "")
    return parser.links


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export", type=Path, help="Native Shopify product CSV")
    parser.add_argument("--plan", type=Path, default=Path("content/product-seo.json"))
    args = parser.parse_args()
    planned = json.loads(args.plan.read_text())["products"]
    actual = {
        row["Handle"]: row
        for row in csv.DictReader(args.export.open(encoding="utf-8-sig", newline=""))
        if row["Title"]
    }
    errors = []
    for product in planned:
        handle = product["handle"]
        row = actual.get(handle)
        if row is None:
            errors.append(f"{handle}: missing from export")
            continue
        if row["Status"] != product["status"] or row["Published"] != product["published"]:
            errors.append(f"{handle}: status or publication differs")
        for field, expected in product["fields"].items():
            value = row.get(field, "")
            if field == "SEO Title":
                # Shopify stores an empty override when the title equals the H1.
                value = value or row["Title"]
            if field == "Body (HTML)":
                if links(value) != links(expected):
                    errors.append(f"{handle}: description links differ")
                value, expected = text(value), text(expected)
            elif field == "Product Category":
                # Exported taxonomy ancestors can change; verify the precise leaf.
                value, expected = value.split(" > ")[-1], expected.split(" > ")[-1]
            if value != expected:
                errors.append(f"{handle}: {field} differs")
    if errors:
        print("\n".join(errors))
        raise SystemExit(1)
    print(f"Verified {len(planned)} products: native copy, SEO, classification, links and publication.")


if __name__ == "__main__":
    main()
