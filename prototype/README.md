# Validated Prototype

`validated-prototype.jsx` is a single-file React component (sample data, no backend) that was built and reviewed during product planning. It is the **UI/UX source of truth** for the real build — every view, interaction, and copy decision in it was deliberate and discussed. See `../docs/product-spec.md` for the reasoning behind each piece.

This is NOT meant to be used as-is in production. Claude Code should:
1. Treat this as the reference for what each page/component should look like and how it should behave
2. Port the views into real Next.js pages under `app/` (see repo root README for target structure)
3. Replace the hardcoded `mentionLog`, `stockMeta`, `explainers`, and `youtubers` sample data with real Supabase queries
4. Preserve the specific interaction details that were deliberately designed — e.g. the one-time discovery tooltip on the ELI10 sidebar trigger, the momentum badge logic, the three-layer disclaimer system, the "swap in place" behavior when clicking a related ticker inside the explainer sidebar

Views included in this prototype:
- By stock (searchable, sortable list + detail page with 30-day mention timeline)
- By YouTuber (channel list + individual call history)
- Leaderboard (week/month/year activity ranking)
- Watchlist (expandable cards, sortable)
- Submit a channel (form, not wired to a backend)
- ELI10 explainer sidebar (with sample data for NVDA, MU, SNDK, MRVL, COHR, OKLO, BE, UEC)
- First-visit disclaimer modal + persistent banner
