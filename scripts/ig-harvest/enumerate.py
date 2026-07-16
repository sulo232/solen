#!/usr/bin/env python3
"""
Stage 1 - ENUMERATE (anonymous).
Paginate a public Instagram profile's full post list into a manifest.json.

NO LOGIN NEEDED. Instagram's private feed API
(/api/v1/feed/user/{id}/) answers anonymously with a bootstrapped
csrftoken + the public web app-id, returning items WITH video_versions
whose CDN urls also download anonymously. (Verified 2026-07-16: yt-dlp's
extraction path is blocked, but this direct path is not.)

Usage:
  python3 enumerate.py <username> <out_dir> [cookies.txt]

cookies.txt is optional; if given it's used, but a logged-in session is
NOT required. Writes <out_dir>/manifest.json.
"""
import sys, os, json, time, random, http.cookiejar, urllib.request, urllib.parse, urllib.error

APP_ID = "936619743392459"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


import http.client


class IG:
    """Anonymous IG client that re-bootstraps its session on a 401/429 throttle."""

    def __init__(self, username, cookies_path=None):
        self.username = username
        self.cookies_path = cookies_path
        self._new_session()

    def _new_session(self):
        cj = http.cookiejar.MozillaCookieJar()
        if self.cookies_path and os.path.exists(self.cookies_path):
            try:
                cj.load(self.cookies_path, ignore_discard=True, ignore_expires=True)
            except Exception:
                pass
        op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
        op.addheaders = [("User-Agent", UA)]
        if not any(c.name == "csrftoken" for c in cj):
            try:
                op.open("https://www.instagram.com/", timeout=25).read()
            except Exception:
                pass
        self.cj = cj
        self.csrf = next((c.value for c in cj if c.name == "csrftoken"), "")
        op.addheaders = [
            ("User-Agent", UA),
            ("X-IG-App-ID", APP_ID),
            ("X-CSRFToken", self.csrf),
            ("X-Requested-With", "XMLHttpRequest"),
            ("Referer", f"https://www.instagram.com/{self.username}/"),
            ("Accept", "*/*"),
        ]
        self.op = op

    def get_json(self, url, deadline_s=5400):
        # IG rate-limits the anonymous feed API by IP. Throttle responses
        # (401/429/403) are WAITED OUT, not counted against a try budget:
        # loop with escalating capped cooldowns until success or a wall-clock
        # deadline (default 90 min). Genuine network errors get a small budget.
        start = time.time()
        neterr = 0
        throttles = 0
        last = None
        while time.time() - start < deadline_s:
            try:
                with self.op.open(url, timeout=45) as r:
                    return json.loads(r.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                last = e
                if e.code in (401, 429, 403, 560):
                    throttles += 1
                    wait = min(300, 30 * (2 ** min(throttles, 4))) + random.uniform(0, 20)
                    print(f"    throttle {e.code} (#{throttles}), cooldown {wait:.0f}s + new session", flush=True)
                    time.sleep(wait)
                    self._new_session()
                else:
                    neterr += 1
                    if neterr > 8:
                        raise
                    time.sleep(5 + neterr * 3)
            except (urllib.error.URLError, http.client.IncompleteRead, ValueError, TimeoutError) as e:
                last = e
                neterr += 1
                if neterr > 8:
                    raise
                time.sleep(3 + neterr * 3 + random.random())
        raise last if last else TimeoutError("get_json deadline exceeded")


def resolve_user_id(ig):
    url = ("https://www.instagram.com/api/v1/users/web_profile_info/?username="
           + urllib.parse.quote(ig.username))
    d = ig.get_json(url)
    u = d["data"]["user"]
    return u["id"], u["edge_owner_to_timeline_media"]["count"]


def best_video_url(node):
    vv = node.get("video_versions")
    return vv[0].get("url") if vv else None


def best_thumb(node):
    ic = node.get("image_versions2", {}).get("candidates")
    return ic[0].get("url") if ic else None


def caption_of(node):
    cap = node.get("caption")
    return (cap or {}).get("text", "") if isinstance(cap, dict) else ""


def enumerate_posts(ig, user_id, out_dir, sleep=(8, 16)):
    # resume from a checkpoint if one exists
    ckpt = os.path.join(out_dir, "_enum_ckpt.json")
    posts, max_id, page, seen = [], None, 0, set()
    if os.path.exists(ckpt):
        c = json.load(open(ckpt))
        posts, max_id = c.get("posts", []), c.get("next_max_id")
        seen = {p["shortcode"] for p in posts}
        page = c.get("page", 0)
        print(f"  resume: {len(posts)} posts, page {page}, cursor={bool(max_id)}", flush=True)
        if not max_id and posts:
            return posts  # already finished
    while True:
        page += 1
        base = f"https://www.instagram.com/api/v1/feed/user/{user_id}/?count=33"
        url = base + (f"&max_id={urllib.parse.quote(max_id)}" if max_id else "")
        d = ig.get_json(url)
        items = d.get("items", [])
        for it in items:
            code = it.get("code")
            if code in seen:
                continue
            seen.add(code)
            posts.append({
                "shortcode": code,
                "pk": it.get("pk"),
                "is_video": bool(it.get("media_type") == 2 or it.get("video_versions")),
                "video_url": best_video_url(it),
                "thumb_url": best_thumb(it),
                "caption": caption_of(it),
                "taken_at": it.get("taken_at"),
                "view_count": it.get("play_count") or it.get("ig_play_count") or it.get("view_count"),
                "like_count": it.get("like_count"),
            })
        more = d.get("more_available")
        max_id = d.get("next_max_id") if more else None
        print(f"  page {page}: +{len(items)} (total {len(posts)}) more={more}", flush=True)
        json.dump({"posts": posts, "next_max_id": max_id, "page": page},
                  open(ckpt, "w"), ensure_ascii=False)
        if not more or not max_id:
            break
        time.sleep(random.uniform(*sleep))
    return posts


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    username, out_dir = sys.argv[1], sys.argv[2]
    cookies = sys.argv[3] if len(sys.argv) > 3 else None
    os.makedirs(out_dir, exist_ok=True)
    ig = IG(username, cookies)
    uid, count = resolve_user_id(ig)
    print(f"user {username} id={uid} count={count}", flush=True)
    posts = enumerate_posts(ig, uid, out_dir)
    manifest = {"username": username, "user_id": uid, "count": count,
                "fetched": len(posts), "posts": posts}
    out = os.path.join(out_dir, "manifest.json")
    with open(out, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    vids = sum(1 for p in posts if p["is_video"])
    print(f"WROTE {out}: {len(posts)} posts, {vids} videos", flush=True)


if __name__ == "__main__":
    main()
