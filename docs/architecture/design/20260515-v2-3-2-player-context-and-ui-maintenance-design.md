# v2.3.2 Player Context Resume and UI Maintenance Design

## Scope

v2.3.2 is a patch release focused on low-risk persistence and maintenance items.

- Resume the last selected playlist/category pair from `AmbientUserData`.
- Expand fixed UI icon externalization using the existing CSS mask pattern.
- Add a GitHub issue template and route the issue link to the template URL.

## Playlist/Category Resume

`AmbientUserData.playlistContext` stores:

```json
{
  "playlist": "MyPlaylist.json",
  "category": "Focus"
}
```

The category is stored by name rather than index so playlist edits do not shift the saved target.

Startup behavior:

- If the saved playlist exists, load it.
- If the saved playlist is `MyPlaylist.json`, it is valid only when cloud mode is active and `AmbientMyPlaylist` exists.
- After playlist data is loaded, apply the saved category by name.
- If the category no longer exists, fall back to `All categories`.
- If the playlist no longer exists, keep the previous startup behavior.

## Icon Externalization

Fixed UI icons are moved from inline SVG to `src/assets/icons/*.svg` and rendered via `ui-icon-mask` CSS classes.

v2.3.2 targets:

- Bottom menu icons.
- Drawer header and close icons.
- Options modal close icon.
- Accordion caret icons.
- Playlist mode menu icons.
- Form success check icons.

The DOM event targets and IDs remain unchanged.

## GitHub Issue Link

The report link now points to:

```text
https://github.com/ka215/ambient/issues/new?template=bug_report.yml
```

No GitHub API token or automatic issue creation is introduced in v2.3.2.
