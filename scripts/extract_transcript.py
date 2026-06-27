"""
extract_transcript.py

Pulls the caption transcript for a given YouTube video ID.
Handles videos with no captions / disabled captions gracefully (returns None,
logs a warning) rather than crashing the pipeline.

Usage as a module:
    from extract_transcript import get_transcript
    text = get_transcript("dQw4w9WgXcQ")
"""

from pathlib import Path
from youtube_transcript_api import YouTubeTranscriptApi
from yt_dlp import YoutubeDL

COOKIES_FILE = Path(__file__).parent / "youtube-cookies.txt"

# yt-dlp based fetcher — more robust against YouTube IP blocks than direct HTTP requests
_ydl_opts = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "writesubtitles": False,
    "writeautomaticsub": False,
    **({"cookiefile": str(COOKIES_FILE)} if COOKIES_FILE.exists() else {}),
}

def _get_transcript_ytdlp(video_id: str) -> str | None:
    """Fetch transcript via yt-dlp, which mimics a real browser and handles rate limiting better."""
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        with YoutubeDL(_ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            subtitles = info.get("subtitles") or {}
            auto_captions = info.get("automatic_captions") or {}

            # Prefer manual captions, fall back to auto-generated
            lang_tracks = subtitles.get("en") or auto_captions.get("en") or []
            if not lang_tracks:
                # Try any English variant (en-US, en-GB, etc.)
                for key in list(subtitles.keys()) + list(auto_captions.keys()):
                    if key.startswith("en"):
                        lang_tracks = (subtitles.get(key) or auto_captions.get(key) or [])
                        break

            if not lang_tracks:
                return None

            # Find a JSON3 or srv1 format to parse
            import urllib.request, json as _json
            for fmt in lang_tracks:
                if fmt.get("ext") in ("json3", "srv1", "vtt"):
                    caption_url = fmt["url"]
                    with urllib.request.urlopen(caption_url, timeout=10) as resp:
                        raw = resp.read().decode("utf-8")
                    if fmt["ext"] == "json3":
                        data = _json.loads(raw)
                        texts = [e.get("segs", [{}])[0].get("utf8", "") for e in data.get("events", []) if e.get("segs")]
                        return " ".join(t for t in texts if t.strip())
                    else:
                        # Strip XML/VTT tags for srv1/vtt
                        import re
                        return re.sub(r"<[^>]+>", " ", raw).strip()
    except Exception as e:
        print(f"[extract_transcript] yt-dlp failed for {video_id}: {e}")
    return None


def get_transcript(video_id: str) -> str | None:
    """
    Returns the full transcript text for a video, or None if unavailable.
    Tries yt-dlp first (more robust against IP blocks), falls back to
    youtube-transcript-api direct HTTP if yt-dlp returns nothing.
    """
    result = _get_transcript_ytdlp(video_id)
    if result:
        return result

    # Fallback to direct API with cookies if available
    try:
        if COOKIES_FILE.exists():
            api = YouTubeTranscriptApi(cookie_path=str(COOKIES_FILE))
        else:
            api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id)
        return " ".join(chunk.text for chunk in fetched)
    except Exception as e:
        print(f"[extract_transcript] Could not get transcript for {video_id}: {e}")
        return None


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python extract_transcript.py <video_id>")
        sys.exit(1)

    result = get_transcript(sys.argv[1])
    if result:
        print(result[:500] + "..." if len(result) > 500 else result)
    else:
        print("No transcript retrieved.")
