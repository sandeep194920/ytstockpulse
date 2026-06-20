"""
extract_transcript.py

Pulls the caption transcript for a given YouTube video ID.
Handles videos with no captions / disabled captions gracefully (returns None,
logs a warning) rather than crashing the pipeline.

Usage as a module:
    from extract_transcript import get_transcript
    text = get_transcript("dQw4w9WgXcQ")
"""

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)


def get_transcript(video_id: str) -> str | None:
    """Returns the full transcript text for a video, or None if unavailable."""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        full_text = " ".join(chunk["text"] for chunk in transcript_list)
        return full_text
    except (TranscriptsDisabled, NoTranscriptFound):
        print(f"[extract_transcript] No transcript available for {video_id}")
        return None
    except VideoUnavailable:
        print(f"[extract_transcript] Video unavailable: {video_id}")
        return None
    except Exception as e:
        # Catch-all so one bad video doesn't kill a batch run — log and move on
        print(f"[extract_transcript] Unexpected error for {video_id}: {e}")
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
