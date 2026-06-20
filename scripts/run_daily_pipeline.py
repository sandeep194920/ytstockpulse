"""
run_daily_pipeline.py

End-to-end orchestration for a single video: fetch transcript -> classify ->
merge into Supabase. This is the proof-of-concept entry point referenced in
README.md milestone 3 ("single-channel, single-video proof of concept").

Once this works end-to-end for one video, wire it up to:
  - fetch_new_videos.py for discovering new uploads per tracked channel
    (WebSub-triggered or polling fallback)
  - a scheduler (cron, or a serverless scheduled function) for daily runs
    across all active channels in the `youtubers` table

NOT YET BUILT: fetch_new_videos.py, freeze_monthly_snapshot.py — these are
the next pieces after this proof-of-concept is validated. See README.md
"First milestones" for suggested build order.

Usage:
    python run_daily_pipeline.py <video_id> <youtuber_id> <video_url> <mentioned_at_iso>
"""

import sys
from dotenv import load_dotenv

load_dotenv()

from extract_transcript import get_transcript
from classify_mentions import classify_transcript
from merge_mentions import insert_mentions


def run_for_video(video_id: str, youtuber_id: str, video_url: str, mentioned_at: str, video_title: str = ""):
    print(f"[pipeline] Processing video {video_id}...")

    transcript = get_transcript(video_id)
    if not transcript:
        print(f"[pipeline] No transcript available for {video_id}, skipping.")
        return

    print(f"[pipeline] Transcript retrieved ({len(transcript)} chars). Classifying...")
    classified = classify_transcript(transcript, video_title=video_title)

    if not classified:
        print(f"[pipeline] No qualifying stock mentions found in {video_id}.")
        return

    print(f"[pipeline] Found {len(classified)} mention(s): {[c['ticker'] for c in classified]}")

    inserted = insert_mentions(
        youtuber_id=youtuber_id,
        video_id=video_id,
        video_url=video_url,
        mentioned_at=mentioned_at,
        classified=classified,
    )

    print(f"[pipeline] Inserted {inserted} new mention row(s) for video {video_id}.")


if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python run_daily_pipeline.py <video_id> <youtuber_id> <video_url> <mentioned_at_iso> [video_title]")
        sys.exit(1)

    video_id, youtuber_id, video_url, mentioned_at = sys.argv[1:5]
    video_title = sys.argv[5] if len(sys.argv) > 5 else ""

    run_for_video(video_id, youtuber_id, video_url, mentioned_at, video_title)
