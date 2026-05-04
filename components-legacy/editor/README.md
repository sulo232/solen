# Visual Editor (Admin-Only)

Admin tool at `/dashboard/editor` for visually selecting elements on the live solen.ch site and generating Claude Code-compatible roadmaps.

## How It Works

1. **EditorPage** renders the live site in an iframe with a toolbar (URL bar, device presets, edit mode toggle)
2. **editor-bridge.js** is injected into the iframe on load — it handles element hover/click highlighting and blocks mutating API calls (POST/PATCH/DELETE to `/api/`)
3. When an element is clicked, **EditPanel** opens showing element info (tag, selector, component hint)
4. Admin describes the desired change → saves as a feature request → generates a roadmap via Claude API
5. Generated roadmaps follow CLAUDE.md R1-R10 standards and can be copied/downloaded as `.md` files

## Component Detection

The editor tries to detect which React component an element belongs to by walking up the DOM tree looking for `data-component` attributes. To improve detection, add these attributes to key components:

```tsx
<div data-component="SalonCard">
  ...
</div>
```

If no `data-component` is found, the admin can type the component name manually.

## Cost Tracking

Each Claude API call logs `input_tokens`, `output_tokens`, `model`, and `generated_at` to `feature_requests.token_usage`. The RequestList view shows cumulative costs. At current Sonnet pricing (~$0.003/1K input, ~$0.015/1K output), a typical roadmap costs ~$0.13.

## Security

- All API routes use the full 6-layer security stack (feature flag → auth → ban → role → rate limit → validation)
- Rate limited to 5 roadmap generations per minute
- `ANTHROPIC_API_KEY` is server-side only, never exposed to the client
- The iframe bridge only activates when the parent sends `EDITOR_ACTIVATE` — zero impact on normal visitors
