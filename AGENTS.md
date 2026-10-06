<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules
- AI calls go through `src/routes/api/ai.ts` (bearer-verified server route, Gemini `google/gemini-3.8-flash` via Lovable AI Gateway) — keeps the key server-side.
- English/Marathi strings live in `src/lib/i18n.tsx`; add both languages for every new key.
- Roles live in `user_roles`; first signed-up user becomes admin via `handle_new_user` trigger.
- Uploaded files use private buckets (`documents`, `avatars`) with `<user_id>/` folder paths and signed URLs.
- tsconfig strict extras (exactOptionalPropertyTypes etc.) removed to fit Supabase-generated types.
