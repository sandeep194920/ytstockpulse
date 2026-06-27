"""
fetch_new_videos.py

Fetches videos published after a given date for all active channels in the
youtubers table, then runs the full pipeline (transcript -> classify -> merge)
for each one.

Designed for two modes:
  - Backfill: python fetch_new_videos.py --since 2026-05-01
  - Daily:    python fetch_new_videos.py  (defaults to last 24 hours)

Progress is tracked in a JSON checkpoint file so the script is resumable —
if it crashes halfway through, re-running skips already-processed video IDs.

Requires:
  YOUTUBE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY in .env.local
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")

from googleapiclient.discovery import build
from supabase import create_client, Client

from extract_transcript import get_transcript
from classify_mentions import classify_transcript
from merge_mentions import insert_mentions

YOUTUBE_API_KEY = os.environ["YOUTUBE_API_KEY"]
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

supabase: Client = create_client(
    os.environ["NEXT_PUBLIC_SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

CHECKPOINT_FILE = Path(__file__).parent / "fetch_progress.json"


def load_checkpoint() -> set[str]:
    """Returns set of already-processed video IDs from the checkpoint file."""
    if CHECKPOINT_FILE.exists():
        data = json.loads(CHECKPOINT_FILE.read_text())
        return set(data.get("processed_video_ids", []))
    return set()


def save_checkpoint(processed: set[str]):
    CHECKPOINT_FILE.write_text(json.dumps({"processed_video_ids": list(processed)}, indent=2))


def get_active_channels() -> list[dict]:
    """Fetch all active youtubers from Supabase."""
    result = supabase.table("youtubers").select("id, channel_name, youtube_channel_id").eq("status", "active").execute()
    return result.data or []


def resolve_channel_id(channel_id_or_handle: str) -> str | None:
    """
    Resolves a @handle or UC... ID to a canonical UC... channel ID.
    The YouTube API's channels.list only accepts UC... IDs, not @handles.
    """
    if channel_id_or_handle.startswith("UC"):
        return channel_id_or_handle

    handle = channel_id_or_handle.lstrip("@")
    resp = youtube.channels().list(part="id", forHandle=handle).execute()
    items = resp.get("items", [])
    if not items:
        print(f"[fetch] Could not resolve handle: @{handle}")
        return None
    return items[0]["id"]


def get_uploads_playlist_id(channel_id_or_handle: str) -> str | None:
    """Gets the uploads playlist ID for a channel (needed to list videos efficiently)."""
    channel_id = resolve_channel_id(channel_id_or_handle)
    if not channel_id:
        return None
    resp = youtube.channels().list(part="contentDetails", id=channel_id).execute()
    items = resp.get("items", [])
    if not items:
        return None
    return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]


def get_videos_since(channel_id: str, since_dt: datetime) -> list[dict]:
    """
    Returns list of {video_id, video_url, title, published_at} dicts for
    videos published after since_dt on the given channel.
    Paginates through the uploads playlist to find all matching videos.
    Stops early once it hits videos older than since_dt (playlist is newest-first).
    """
    playlist_id = get_uploads_playlist_id(channel_id)
    if not playlist_id:
        print(f"[fetch] Could not get uploads playlist for channel {channel_id}")
        return []

    videos = []
    page_token = None

    while True:
        kwargs = {
            "part": "snippet",
            "playlistId": playlist_id,
            "maxResults": 50,
        }
        if page_token:
            kwargs["pageToken"] = page_token

        resp = youtube.playlistItems().list(**kwargs).execute()

        for item in resp.get("items", []):
            snippet = item["snippet"]
            published_str = snippet.get("publishedAt", "")
            if not published_str:
                continue

            published_dt = datetime.fromisoformat(published_str.replace("Z", "+00:00"))

            if published_dt < since_dt:
                # Playlist is newest-first; once we're past the cutoff, stop
                return videos

            video_id = snippet.get("resourceId", {}).get("videoId")
            if not video_id:
                continue

            videos.append({
                "video_id": video_id,
                "video_url": f"https://www.youtube.com/watch?v={video_id}",
                "title": snippet.get("title", ""),
                "published_at": published_str,
            })

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return videos


def process_video(video: dict, youtuber_id: str, processed: set[str]) -> bool:
    """
    Runs full pipeline for one video. Returns True if processed, False if skipped.
    Updates processed set in place.
    """
    video_id = video["video_id"]

    if video_id in processed:
        print(f"[fetch] Skipping already-processed video {video_id}")
        return False

    print(f"[fetch] Processing: {video['title'][:60]} ({video_id})")

    time.sleep(2)  # avoid YouTube transcript API rate limiting
    transcript = get_transcript(video_id)
    if not transcript:
        print(f"[fetch] No transcript for {video_id}, skipping.")
        processed.add(video_id)
        save_checkpoint(processed)
        return False

    classified = classify_transcript(transcript, video_title=video["title"])

    if not classified:
        print(f"[fetch] No qualifying mentions in {video_id}.")
    else:
        print(f"[fetch] Found {len(classified)} mention(s): {[c['ticker'] for c in classified]}")
        insert_mentions(
            youtuber_id=youtuber_id,
            video_id=video_id,
            video_url=video["video_url"],
            mentioned_at=video["published_at"],
            classified=classified,
        )

    processed.add(video_id)
    save_checkpoint(processed)
    return True


def main(since_dt: datetime):
    channels = get_active_channels()
    if not channels:
        print("[fetch] No active channels found in youtubers table. Add some first.")
        sys.exit(1)

    print(f"[fetch] Found {len(channels)} active channel(s). Fetching videos since {since_dt.date()}...")
    processed = load_checkpoint()

    total_videos = 0
    total_processed = 0

    for channel in channels:
        channel_name = channel["channel_name"]
        channel_yt_id = channel["youtube_channel_id"]
        youtuber_id = channel["id"]

        print(f"\n[fetch] === {channel_name} ({channel_yt_id}) ===")
        videos = get_videos_since(channel_yt_id, since_dt)
        print(f"[fetch] {len(videos)} video(s) found since {since_dt.date()}")

        total_videos += len(videos)
        for video in videos:
            did_process = process_video(video, youtuber_id, processed)
            if did_process:
                total_processed += 1

    print(f"\n[fetch] Done. {total_processed}/{total_videos} video(s) processed across {len(channels)} channel(s).")
    print(f"[fetch] Checkpoint saved to {CHECKPOINT_FILE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch and classify YouTube videos for all active channels.")
    parser.add_argument(
        "--since",
        type=str,
        default=None,
        help="ISO date to start from, e.g. 2026-05-01. Defaults to last 24 hours.",
    )
    args = parser.parse_args()

    if args.since:
        since_dt = datetime.fromisoformat(args.since).replace(tzinfo=timezone.utc)
    else:
        since_dt = datetime.now(timezone.utc) - timedelta(hours=24)

    main(since_dt)
