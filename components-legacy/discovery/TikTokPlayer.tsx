"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { FROST_GLASS } from "@/lib/frost-glass";

// TikTok's newer official Embed Player (player/v1). Unlike the old embed/v2, its query params let us hide TikTok's
// OWN player chrome (controls / progress bar / play button / volume / fullscreen / timestamp / related videos), and it
// exposes a postMessage API so we drive play/pause/mute/seek from OUR control bar. What we still CANNOT remove (it's
// TikTok's cross-origin iframe + legally-mandated attribution): the TikTok logo, the creator handle, and the EU/CH
// cookie-consent wall. Docs: https://developers.tiktok.com/doc/embed-player
const PLAYER_PARAMS = [
  "controls=0",
  "progress_bar=0",
  "play_button=0",
  "volume_control=0",
  "fullscreen_button=0",
  "timestamp=0",
  "rel=0",
  "native_context_menu=0",
  "music_info=0",
  "description=0",
  "closed_caption=0",
  // autoplay=0: TikTok's player errors ("AUTOPLAY_ERROR") if asked to autoplay via the URL param. Instead we load
  // paused and send a play() postMessage on onPlayerReady (inside the user's tap gesture), which plays reliably.
  "autoplay=0",
  "muted=1",
  "loop=1",
].join("&");

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TikTokPlayer({ videoId, title, aspect, tiktokUrl }: { videoId: string; title?: string; aspect?: string; tiktokUrl?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true); // autoplay=1
  const [muted, setMuted] = useState(true); // muted=1 (browsers require muted to autoplay)
  const [pos, setPos] = useState({ t: 0, d: 0 });

  const post = (type: string, value?: number) => {
    iframeRef.current?.contentWindow?.postMessage({ type, value, "x-tiktok-player": true }, "*");
  };

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { ["x-tiktok-player"]?: boolean; type?: string; value?: unknown };
      if (!d || typeof d !== "object" || d["x-tiktok-player"] !== true) return;
      switch (d.type) {
        case "onPlayerReady":
          setReady(true);
          post("play"); // auto-start once ready (the user already tapped, so the gesture allows muted playback)
          post("mute"); // FORCE muted on start — owner: the audio is loud. User opts INTO sound via the mute toggle.
          setMuted(true);
          break;
        case "onStateChange":
          // -1 init, 0 ended, 1 playing, 2 paused, 3 buffering
          setPlaying(d.value === 1 || d.value === 3);
          break;
        case "onCurrentTime": {
          const v = d.value as { currentTime?: number; duration?: number } | undefined;
          if (v) setPos({ t: v.currentTime ?? 0, d: v.duration ?? 0 });
          break;
        }
        case "onMute":
          setMuted(!!d.value);
          break;
      }
    };
    window.addEventListener("message", onMsg);
    // Fallback: if onPlayerReady is missed (or the user lingers on the cookie wall), reveal controls after a beat so
    // they're never permanently hidden. postMessage no-ops until the player actually initialises, so this is safe.
    const t = setTimeout(() => setReady(true), 7000);
    return () => {
      window.removeEventListener("message", onMsg);
      clearTimeout(t);
    };
  }, []);

  const togglePlay = () => {
    post(playing ? "pause" : "play");
    setPlaying((p) => !p);
  };
  const toggleMute = () => {
    if (muted) {
      // Unmute: iOS/Safari often drops the FIRST cross-origin unmute (the tap's user-gesture doesn't carry across the
      // async postMessage into TikTok's frame), which is why it took two taps. Re-send once shortly after so a single
      // tap sticks. No optimistic state flip — the icon follows the player's real onMute event, so it never lies.
      post("unMute");
      setTimeout(() => post("unMute"), 350);
    } else {
      post("mute");
    }
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pos.d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const to = frac * pos.d;
    post("seekTo", to);
    setPos((p) => ({ ...p, t: to }));
  };

  const pct = pos.d ? Math.min(100, (pos.t / pos.d) * 100) : 0;

  return (
    <div className="absolute inset-0">
      {/* COVER-fill: the iframe is sized to the video's real aspect ratio and made at least as big as the box, then
          centered, so TikTok fills the frame with no pillarbox/letterbox and the container's overflow-hidden crops
          the excess (matches the cover image). */}
      <iframe
        ref={iframeRef}
        src={`https://www.tiktok.com/player/v1/${videoId}?${PLAYER_PARAMS}`}
        className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
        style={{ aspectRatio: aspect || "9 / 16" }}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        title={title || "TikTok"}
      />

      {/* Our own control bar — appears once the player is ready (i.e. after the cookie wall is cleared), so the
          controls are never dead. TikTok's own controls are hidden (controls=0), so these are the only ones. */}
      {ready && (
        // Everything OURS stays bottom-LEFT: TikTok's like/comment/share rail lives on the right and can't be hidden,
        // so we keep clear of it. Raised well up (pb-9) so the bar isn't clipped by the white card pulled over the hero.
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3.5 pb-7 pt-14">
          {/* progress (taller invisible hit area for easy scrubbing) */}
          <div onClick={seek} className="mb-3 cursor-pointer py-1.5" role="slider" aria-label="Seek" aria-valuenow={Math.round(pct)}>
            <div className="h-[3px] w-full rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {/* Controls: play + a "TikTok" jump pill (legal attribution — links to the original clip) on the LEFT;
              mute on the RIGHT (owner). The TikTok NAME as text is the sanctioned referential use (their logo can't
              be used without permission). */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                style={FROST_GLASS}
                className="grid h-11 w-11 place-items-center rounded-full text-s-ink transition-transform duration-150 active:scale-95 active:duration-[80ms]"
              >
                {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
              </button>
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="View on TikTok"
                  style={FROST_GLASS}
                  className="grid h-11 place-items-center rounded-full px-4 text-[12.5px] font-semibold tracking-[-0.01em] text-s-ink transition-transform duration-150 active:scale-95 active:duration-[80ms]"
                >
                  TikTok
                </a>
              )}
              <span className="ml-0.5 font-mono text-[12px] tabular-nums text-white/90">{fmt(pos.t)} / {fmt(pos.d)}</span>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              style={FROST_GLASS}
              className="grid h-11 w-11 place-items-center rounded-full text-s-ink transition-transform duration-150 active:scale-95 active:duration-[80ms]"
            >
              {muted ? <VolumeX size={19} strokeWidth={2.2} /> : <Volume2 size={19} strokeWidth={2.2} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
