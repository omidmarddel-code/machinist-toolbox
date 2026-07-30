#!/usr/bin/env python3
"""Build the Persian technology news feed from public Persian RSS feeds."""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "www" / "data" / "mechanical-news.json"
MAX_ITEMS = 24
MAX_AGE = timedelta(hours=24)
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
IMG_SRC_RE = re.compile(
    r"""<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']""",
    re.IGNORECASE,
)
URL_IN_TEXT_RE = re.compile(
    r"""https?://[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?""",
    re.IGNORECASE,
)


def request(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (compatible; MachinistToolboxNewsBot/1.0; "
                "+https://github.com/omidmarddel-code/machinist-toolbox)"
            ),
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


def child_raw(node: ET.Element, name: str) -> str:
    element = node.find(name)
    if element is None:
        return ""
    parts: list[str] = []
    if element.text:
        parts.append(element.text)
    for child in list(element):
        parts.append(ET.tostring(child, encoding="unicode"))
        if child.tail:
            parts.append(child.tail)
    return "".join(parts).strip()


def item_date(value: str) -> datetime:
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc)
    except (TypeError, ValueError, IndexError):
        return datetime.now(timezone.utc)


def normalize_image_url(url: str) -> str:
    value = html.unescape((url or "").strip())
    if not value:
        return ""
    if value.startswith("//"):
        return "https:" + value
    return value


def extract_image(item: ET.Element) -> str:
    """Pull the best available image URL from common RSS fields."""
    # Digiato-style: <image><url>...</url></image>
    image_node = item.find("image")
    if image_node is not None:
        url_node = image_node.find("url")
        if url_node is not None and (url_node.text or "").strip():
            return normalize_image_url(url_node.text)
        if (image_node.text or "").strip().startswith("http"):
            return normalize_image_url(image_node.text)

    # media:content / media:thumbnail
    for tag in (
        "{http://search.yahoo.com/mrss/}content",
        "{http://search.yahoo.com/mrss/}thumbnail",
        "thumbnail",
        "enclosure",
    ):
        for node in item.findall(tag):
            candidate = (
                node.attrib.get("url")
                or node.attrib.get("href")
                or (node.text or "")
            )
            candidate = normalize_image_url(candidate)
            if candidate.startswith("http"):
                return candidate

    # Zoomit-style: <img src="..."> inside description / content:encoded
    raw_blobs = [
        child_raw(item, "description"),
        child_raw(item, "{http://purl.org/rss/1.0/modules/content/}encoded"),
    ]
    for blob in raw_blobs:
        match = IMG_SRC_RE.search(blob)
        if match:
            return normalize_image_url(match.group(1))
        match = URL_IN_TEXT_RE.search(html.unescape(blob))
        if match:
            return normalize_image_url(match.group(0))

    return ""


def parse_source(source: str, url: str) -> list[dict]:
    root = ET.fromstring(request(url))
    results = []
    for item in root.findall(".//item"):
        title, link = child_text(item, "title"), child_text(item, "link")
        description = (
            clean_text(child_raw(item, "description"))
            or clean_text(
                child_raw(item, "{http://purl.org/rss/1.0/modules/content/}encoded")
            )
        )
        if title and link:
            publisher = child_text(item, "source") or source
            results.append(
                {
                    "title": title,
                    "summary": description[:600],
                    "url": link,
                    "source": publisher,
                    "image": extract_image(item),
                    "published": item_date(child_text(item, "pubDate")),
                }
            )
    return results


def main() -> int:
    articles, failures = [], []
    for source, url in RSS_SOURCES.items():
        try:
            articles.extend(parse_source(source, url))
        except Exception as error:  # noqa: BLE001 - collect per-source failures
            failures.append(f"{source}: {error}")

    cutoff = datetime.now(timezone.utc) - MAX_AGE
    recent = [article for article in articles if article["published"] >= cutoff]

    seen_urls, selected = set(), []
    for article in sorted(recent, key=lambda item: item["published"], reverse=True):
        if article["url"] not in seen_urls:
            seen_urls.add(article["url"])
            selected.append(article)
        if len(selected) == MAX_ITEMS:
            break

    # If the last 24h window is empty (feed lag / timezone quirks), fall back
    # to the newest available items so the UI is never blank.
    if not selected:
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
            "image": article["image"],
            "date": article["published"].date().isoformat(),
            "publishedAt": article["published"].isoformat(),
        }
        for article in selected
    ]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(feed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with_images = sum(1 for item in feed if item["image"])
    print(
        f"Wrote {len(feed)} Persian RSS articles "
        f"({with_images} with images) to {OUTPUT.relative_to(ROOT)}"
    )
    if failures:
        print("Skipped unavailable sources: " + "; ".join(failures), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
