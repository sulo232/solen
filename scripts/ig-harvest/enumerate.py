#!/usr/bin/env python3
"""
Stage 1 - ENUMERATE.
Paginate a public Instagram profile's full post list into a manifest.json.

Needs a logged-in cookie file (Netscape format) that contains `sessionid`
+ `ds_user_id`. The pre-login cookies (csrftoken/datr/ig_did/mid) are NOT
enough: Instagram killed anonymous pagination + media responses.

Usage:
  python3 enumerate.py <username> <cookies.txt> <out_dir>

Writes <out_dir>/manifest.json:
  { "username", "user_id", "count", "fetched_at_epoch", "posts": [
      { "shortcode", "pk", "is_video", "video_url", "thumb_url",
        "caption", "taken_at", "view_count", "like_count" } ] }
"""
import sys, json, time, http.cookiejar, urllib.request, urllib.parse

APP_ID = "936619743392459"  # public web app id used by instagram.com itself
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def load_cookies(path):
    cj = http.cookiejar.MozillaCookieJar()
    cj.load(path, ignore_discard=True, ignore_expires=True)
    have = {c.name for c in cj}
    if "sessionid" not in have or "ds_user_id" not in have:
        sys.exit("FATAL: cookie file has no `sessionid`/`ds_user_id` -> not a "
                 "logged-in export. Re-export while signed in to instagram.com.")
    csrf = next((c.value for c in cj if c.name == "csrftoken"), "")
    return cj, csrf


def opener_for(cj, csrf):
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.addheaders = [
        ("User-Agent", UA),
        ("X-IG-App-ID", APP_ID),
        ("X-CSRFToken", csrf),
        ("X-Requested-With", "XMLHttpRequest"),
        ("Referer", "https://www.instagram.com/"),
        ("Accept", "*/*"),
    ]
    return op


def get_json(op, url):
    with op.open(url, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def resolve_user_id(op, username):
    url = ("https://www.instagram.com/api/v1/users/web_profile_info/?username="
           + urllib.parse.quote(username))
    d = get_json(op, url)
    u = d["data"]["user"]
    return u["id"], u["edge_owner_to_timeline_media"]["count"]


def best_video_url(node):
    # private feed api item: video_versions is a list sorted by quality
    vv = node.get("video_versions")
    if vv:
        return vv[0].get("url")
    return None


def best_thumb(node):
    ic = node.get("image_versions2", {}).get("candidates")
    if ic:
        return ic[0].get("url")
    return None


def caption_of(node):
    cap = node.get("caption")
    return (cap or {}).get("text", "") if isinstance(cap, dict) else ""


def enumerate_posts(op, user_id, sleep=(3, 7)):
    import random
    posts, max_id, page = [], None, 0
    while True:
        page += 1
        base = f"https://www.instagram.com/api/v1/feed/user/{user_id}/?count=33"
        url = base + (f"&max_id={urllib.parse.quote(max_id)}" if max_id else "")
        d = get_json(op, url)
        items = d.get("items", [])
        for it in items:
            posts.append({
                "shortcode": it.get("code"),
                "pk": it.get("pk"),
                "is_video": bool(it.get("media_type") == 2 or it.get("video_versions")),
                "video_url": best_video_url(it),
                "thumb_url": best_thumb(it),
                "caption": caption_of(it),
                "taken_at": it.get("taken_at"),
                "view_count": it.get("play_count") or it.get("view_count"),
                "like_count": it.get("like_count"),
            })
        print(f"  page {page}: +{len(items)} (total {len(posts)})", flush=True)
        if not d.get("more_available"):
            break
        max_id = d.get("next_max_id")
        if not max_id:
            break
        time.sleep(random.uniform(*sleep))
    return posts


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    username, cookies_path, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    import os
    os.makedirs(out_dir, exist_ok=True)
    cj, csrf = load_cookies(cookies_path)
    op = opener_for(cj, csrf)
    uid, count = resolve_user_id(op, username)
    print(f"user {username} id={uid} count={count}", flush=True)
    posts = enumerate_posts(op, uid)
    manifest = {
        "username": username, "user_id": uid, "count": count,
        "fetched": len(posts), "posts": posts,
    }
    out = os.path.join(out_dir, "manifest.json")
    with open(out, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    vids = sum(1 for p in posts if p["is_video"])
    print(f"WROTE {out}: {len(posts)} posts, {vids} videos", flush=True)


if __name__ == "__main__":
    main()
