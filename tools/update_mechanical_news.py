#!/usr/bin/env python3
"""Build the Persian mechanical engineering news feed from RSS sources."""

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
MAX_ITEMS = 25
MAX_AGE = timedelta(hours=24)
TIMEOUT_SECONDS = 30

# Mechanical engineering and manufacturing news sources
# Primary: English sources that will be translated to Persian
# Fallback: Persian tech sources for general engineering news
RSS_SOURCES = {
    "Engineering.com": "https://www.engineering.com/feed",
    "ASME": "https://www.asme.org/rss/engineering-news",
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


def translate_to_persian(text: str) -> str:
    """Translate English text to Persian using a simple dictionary-based approach.
    For production, consider using a proper translation API."""
    if not text:
        return text
    
    # Common technical terms dictionary - word boundary aware
    translations = {
        # General terms
        "engineering": "مهندسی",
        "mechanical": "مکانیکی",
        "manufacturing": "تولید",
        "design": "طراحی",
        "technology": "فناوری",
        "innovation": "نوآوری",
        "research": "تحقیق",
        "development": "توسعه",
        "industry": "صنعت",
        "industrial": "صنعتی",
        "automation": "اتوماسیون",
        "robot": "ربات",
        "robotics": "رباتیک",
        "artificial intelligence": "هوش مصنوعی",
        "machine learning": "یادگیری ماشین",
        "additive manufacturing": "تولید اضافی",
        "materials": "متریال‌ها",
        "material": "متریال",
        "steel": "فولاد",
        "aluminum": "آلومینیوم",
        "composite": "کامپوزیت",
        "sustainable": "پایدار",
        "sustainability": "پایداری",
        "energy": "انرژی",
        "renewable": "تجدیدپذیر",
        "electric": "الکتریکی",
        "electric vehicle": "وسایل نقلیه الکتریکی",
        "battery": "باتری",
        "solar": "خورشیدی",
        "wind": "بادی",
        "power": "توان",
        "efficiency": "بازده",
        "performance": "عملکرد",
        "system": "سیستم",
        "systems": "سیستم‌ها",
        "control": "کنترل",
        "sensor": "حسگر",
        "data": "داده",
        "digital": "دیجیتال",
        "smart": "هوشمند",
        "advanced": "پیشرفته",
        "breakthrough": "شکست",
        "discovery": "کشف",
        "scientists": "دانشمندان",
        "researchers": "پژوهشگران",
        "company": "شرکت",
        "companies": "شرکت‌ها",
        "announces": "اعلام می‌کند",
        "announced": "اعلام شد",
        "launch": "رونمایی",
        "launched": "رونمایی شد",
        "introduces": "معرفی می‌کند",
        "introduced": "معرفی شد",
        "report": "گزارش",
        "study": "مطالعه",
        "analysis": "تحلیل",
        "market": "بازار",
        "global": "جهانی",
        "future": "آینده",
        "challenge": "چالش",
        "solution": "راه‌حل",
    }
    
    # Sort by length (longest first) to avoid partial replacements
    sorted_terms = sorted(translations.items(), key=lambda x: len(x[0]), reverse=True)
    
    result = text
    for eng, per in sorted_terms:
        # Use word boundaries for better matching
        pattern = re.compile(r'\b' + re.escape(eng) + r'\b', re.IGNORECASE)
        result = pattern.sub(per, result)
    
    return result


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
            # Translate title and description to Persian
            translated_title = translate_to_persian(title)
            translated_desc = translate_to_persian(description[:600])
            results.append(
                {
                    "title": translated_title,
                    "summary": translated_desc,
                    "url": link,
                    "source": publisher,
                    "image": extract_image(item),
                    "published": item_date(child_text(item, "pubDate")),
                }
            )
    return results


def main() -> int:
    articles, failures = [], []
    
    print("=" * 60)
    print("Starting mechanical engineering news update...")
    print("=" * 60)
    
    for source, url in RSS_SOURCES.items():
        try:
            print(f"\nFetching from {source}...")
            source_articles = parse_source(source, url)
            articles.extend(source_articles)
            print(f"[OK] Successfully fetched {len(source_articles)} articles from {source}")
        except Exception as error:  # noqa: BLE001 - collect per-source failures
            failures.append(f"{source}: {error}")
            print(f"[FAIL] Failed to fetch from {source}: {error}", file=sys.stderr)

    print(f"\n{'=' * 60}")
    print(f"Total articles fetched: {len(articles)}")
    print(f"Failed sources: {len(failures)}")
    print(f"Successful sources: {len(RSS_SOURCES) - len(failures)}/{len(RSS_SOURCES)}")
    print(f"{'=' * 60}")

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
        print("\n⚠ No articles in last 24h, using newest available articles...")
        for article in sorted(articles, key=lambda item: item["published"], reverse=True):
            if article["url"] not in seen_urls:
                seen_urls.add(article["url"])
                selected.append(article)
            if len(selected) == MAX_ITEMS:
                break

    if not selected:
        print("\n[ERROR] No articles were found; leaving the existing feed untouched.", file=sys.stderr)
        if failures:
            print("\nFailed sources:", file=sys.stderr)
            for failure in failures:
                print(f"  - {failure}", file=sys.stderr)
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
    
    print(f"\n[SUCCESS] Successfully wrote {len(feed)} articles to {OUTPUT.relative_to(ROOT)}")
    print(f"  - {with_images} articles have images")
    print(f"  - Articles from {len(set(item['source'] for item in feed))} different sources")
    
    if failures:
        print(f"\n[WARNING] Skipped {len(failures)} unavailable source(s):", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
    
    print(f"\n{'=' * 60}")
    print("Update completed successfully!")
    print(f"{'=' * 60}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
