#!/usr/bin/env python3
"""Build the Persian tech news feed from Iranian RSS sources (Zoomit, Digiato)."""

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

# Persian-language technology news sources (already in Farsi, no translation needed)
RSS_SOURCES = {
    "Zoomit": "https://zoomit.ir/feed",
    "Digiato": "https://digiato.com/feed",
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


def item_date(value: str) -> datetime | None:
    """Parse an RSS date. Tries RFC 2822 (pubDate), then ISO 8601 (dc:date)."""
    value = (value or "").strip()
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc)
    except (TypeError, ValueError, IndexError, OverflowError):
        pass
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def normalize_image_url(url: str) -> str:
    value = html.unescape((url or "").strip())
    if not value:
        return ""
    if value.startswith("//"):
        return "https:" + value
    return value


def is_valid_image_url(url: str) -> bool:
    """Only accept http(s) image URLs — never data:, javascript:, etc."""
    return url.startswith("https://") or url.startswith("http://")


def clean_summary(text: str) -> str:
    """Strip WordPress ``The post ... appeared first on ...`` boilerplate."""
    cleaned = re.sub(
        r"\s*The post\s+.+?\s+appeared first on\s+[^.]*\.\s*$",
        "",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return cleaned.strip()


def normalize_url(url: str) -> str:
    """Normalize a URL for cross-source duplicate detection."""
    base = re.split(r"[?#]", html.unescape(url).strip())[0].rstrip("/")
    return (
        base.lower()
        .replace("https://www.", "https://")
        .replace("http://www.", "http://")
    )


def normalize_title(title: str) -> str:
    """Normalize a title for cross-source duplicate detection."""
    return re.sub(r"\W+", "", title.lower())


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
    # The description is HTML-encoded, so we unescape before regex matching.
    raw_blobs = [
        child_raw(item, "description"),
        child_raw(item, "{http://purl.org/rss/1.0/modules/content/}encoded"),
    ]
    for blob in raw_blobs:
        unescaped = html.unescape(blob)
        match = IMG_SRC_RE.search(unescaped)
        if match:
            return normalize_image_url(match.group(1))
        match = URL_IN_TEXT_RE.search(unescaped)
        if match:
            return normalize_image_url(match.group(0))

    return ""


DC_DATE = "{http://purl.org/dc/elements/1.1/}date"


def parse_source(source: str, url: str) -> list[dict]:
    root = ET.fromstring(request(url))
    results = []
    for item in root.findall(".//item"):
        title, link = child_text(item, "title"), child_text(item, "link")
        if not title or not link:
            continue
        description = (
            clean_text(child_raw(item, "description"))
            or clean_text(
                child_raw(item, "{http://purl.org/rss/1.0/modules/content/}encoded")
            )
        )
        published = item_date(child_text(item, "pubDate"))
        if published is None:
            published = item_date(child_text(item, DC_DATE))
        publisher = child_text(item, "source") or source
        image = extract_image(item)
        results.append(
            {
                "title": title,
                "summary": clean_summary(description[:600]),
                "url": link,
                "source": publisher,
                "image": image if is_valid_image_url(image) else "",
                "published": published,
            }
        )
    return results


def main() -> int:
    articles, failures = [], []

    print("=" * 60)
    print("Starting Persian tech news update (Zoomit, Digiato)...")
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

    # Drop articles with no publish date (invalid/unknown) so the feed
    # never contains malformed timestamps that break the UI.
    valid_articles = [article for article in articles if article["published"] is not None]

    now = datetime.now(timezone.utc)
    cutoff = now - MAX_AGE
    recent = [
        article for article in valid_articles
        if cutoff <= article["published"] <= now + timedelta(hours=1)
    ]

    seen_urls, seen_titles, selected = set(), set(), []
    for article in sorted(recent, key=lambda item: item["published"], reverse=True):
        url_key = normalize_url(article["url"])
        title_key = normalize_title(article["title"])
        if url_key in seen_urls or title_key in seen_titles:
            continue
        seen_urls.add(url_key)
        seen_titles.add(title_key)
        selected.append(article)
        if len(selected) == MAX_ITEMS:
            break

    # Items with unknown dates are kept as a last-resort fallback so the
    # UI is never empty if every source omits dates.
    undated = [article for article in articles if article["published"] is None]

    # If the last 24h window is empty (feed lag / timezone quirks), fall back
    # to the newest available items so the UI is never blank.
    if not selected:
        print("\nNo articles in last 24h, using newest available articles...")
        fallback_articles = sorted(
            valid_articles,
            key=lambda item: item["published"],
            reverse=True,
        ) + undated
        for article in fallback_articles:
            url_key = normalize_url(article["url"])
            title_key = normalize_title(article["title"])
            if url_key in seen_urls or title_key in seen_titles:
                continue
            seen_urls.add(url_key)
            seen_titles.add(title_key)
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
            "date": (
                article["published"].date().isoformat()
                if article["published"] is not None
                else now.date().isoformat()
            ),
            "publishedAt": (
                article["published"].isoformat()
                if article["published"] is not None
                else now.isoformat()
            ),
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
