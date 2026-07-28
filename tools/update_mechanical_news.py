#!/usr/bin/env python3
"""Build the Persian mechanical-engineering news feed from public RSS feeds."""

from __future__ import annotations

import html
import json
import re
import sys
import time
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
# Google News publishes RSS search feeds, each linking to the originating
# publisher's article.  Separate focused queries prevent unrelated headlines
# from reaching this feed while remaining resilient to a publisher changing
# its own feed address.
RSS_SOURCES = {
    "Mechanical Engineering": "https://news.google.com/rss/search?q=%22mechanical+engineering%22&hl=en-US&gl=US&ceid=US:en",
    "CNC": "https://news.google.com/rss/search?q=CNC+machining&hl=en-US&gl=US&ceid=US:en",
    "Mold Making": "https://news.google.com/rss/search?q=mold+making&hl=en-US&gl=US&ceid=US:en",
    "Manufacturing": "https://news.google.com/rss/search?q=manufacturing&hl=en-US&gl=US&ceid=US:en",
    "CAD/CAM": "https://news.google.com/rss/search?q=CAD+CAM&hl=en-US&gl=US&ceid=US:en",
    "Industrial Automation": "https://news.google.com/rss/search?q=industrial+automation&hl=en-US&gl=US&ceid=US:en",
}
TOPIC_PATTERN = re.compile(
    r"\b(mechanical engineering|cnc|mold(?:ing|making)?|machin(?:e|ing|ist)|manufactur(?:e|ing)|cad(?:/cam)?|cam\b|industrial automation|robotics?|plc\b|metalworking|tooling|metrology|additive manufacturing)\b",
    re.IGNORECASE,
)
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")

def request(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "MachinistToolboxNewsBot/1.0 (+https://github.com/omidmarddel-code/machinist-toolbox)", "Accept": "application/rss+xml, application/xml, text/xml, */*"})
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

def translate_fa(value: str) -> str:
    """Translate with Google's public translation endpoint; no API key is needed."""
    query = urllib.parse.urlencode({"client": "gtx", "sl": "auto", "tl": "fa", "dt": "t", "q": value})
    payload = json.loads(request(f"https://translate.googleapis.com/translate_a/single?{query}").decode("utf-8"))
    return "".join(part[0] for part in payload[0] if part and part[0]).strip()

def parse_source(source: str, url: str) -> list[dict]:
    root = ET.fromstring(request(url))
    results = []
    for item in root.findall(".//item"):
        title, link = child_text(item, "title"), child_text(item, "link")
        description = child_text(item, "description") or child_text(item, "{http://purl.org/rss/1.0/modules/content/}encoded")
        if title and link and TOPIC_PATTERN.search(f"{title} {description}"):
            publisher = child_text(item, "source") or source
            results.append({"title": title, "summary": description[:600], "url": link, "source": publisher, "published": item_date(child_text(item, "pubDate"))})
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
        print("No matching articles were found; leaving the existing feed untouched.", file=sys.stderr)
        print("\n".join(failures), file=sys.stderr)
        return 1
    feed = []
    for index, article in enumerate(selected, 1):
        try:
            title, summary = translate_fa(article["title"]), translate_fa(article["summary"])
        except Exception as error:
            print(f"Translation failed for article {index}: {error}", file=sys.stderr)
            return 1
        feed.append({"title": title, "summary": summary, "url": article["url"], "source": article["source"], "date": article["published"].date().isoformat()})
        time.sleep(0.15)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(feed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(feed)} real RSS articles to {OUTPUT.relative_to(ROOT)}")
    if failures:
        print("Skipped unavailable sources: " + "; ".join(failures), file=sys.stderr)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
