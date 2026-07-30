#!/usr/bin/env python3
"""Build the Persian technology news feed from public Persian RSS feeds."""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "www" / "data" / "mechanical-news.json"
MAX_ITEMS = 24
TIMEOUT_SECONDS = 25

# Persian technology news sources. These feeds publish articles in Persian,
# so no translation is needed.
RSS_SOURCES = {
    "زومیت": "https://www.zoomit.ir/feed/",
    "دیجیاتو": "https://www.digiato.com/feed/",
    "زیرموبایل": "https://www.ziremobile.com/feed/",
}
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def request(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; MachinistToolboxNewsBot/1.0; +https://github.com/omidmarddel-code/machinist-toolbox)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
        return response.read()


def clean_text(value: str | None) -> str:
    return SPACE_RE.sub(" ", html.unescape(TAG_RE.sub(" ", value or ""))).strip()


def child_text(node: ET.Element, name: str) -> str:
    element = node.find(name)
    return clean_text(element.text if element is not None else "")


def item_date(value: str) -> datetime:
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc)
    except (TypeError, ValueError, IndexError):
        return datetime.now(timezone.utc)


def parse_source(source: str, url: str) -> list[dict]:
    root = ET.fromstring(request(url))
    results = []
    for item in root.findall(".//item"):
        title, link = child_text(item, "title"), child_text(item, "link")
        description = (
            child_text(item, "description")
            or child_text(item, "{http://purl.org/rss/1.0/modules/content/}encoded")
        )
        if title and link:
            publisher = child_text(item, "source") or source
            results.append(
                {
                    "title": title,
                    "summary": description[:600],
                    "url": link,
                    "source": publisher,
                    "published": item_date(child_text(item, "pubDate")),
                }
            )
    return results


def main() -> int:
    articles, failures = [], []
    for source, url in RSS_SOURCES.items():
        try:
            articles.extend(parse_source(source, url))
        except Exception as error:
            failures.append(f"{source}: {error}")
    seen_urls, selected = set(), []
    for article in sorted(articles, key=lambda item: item["published"], reverse=True):
        if article["url"] not in seen_urls:
            seen_urls.add(article["url"])
            selected.append(article)
        if len(selected) == MAX_ITEMS:
            break
    if not selected:
        print("No articles were found; leaving the existing feed untouched.", file=sys.stderr)
        print("\n".join(failures), file=sys.stderr)
        return 1
    feed = [
        {
            "title": article["title"],
            "summary": article["summary"],
            "url": article["url"],
            "source": article["source"],
            "date": article["published"].date().isoformat(),
        }
        for article in selected
    ]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(feed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(feed)} Persian RSS articles to {OUTPUT.relative_to(ROOT)}")
    if failures:
        print("Skipped unavailable sources: " + "; ".join(failures), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())