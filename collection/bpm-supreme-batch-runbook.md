# BPM Supreme Batch Runbook

Read this file before every Apple Music to BPM Supreme batch run.

## Current Batch Inputs

- Source songs come from the open Apple Music playlist tabs in Chrome.
- For each Apple Music playlist, scroll to the bottom until the visible song row count is stable before extracting rows.
- Consolidate all extracted songs into `collection/apple-music-open-tabs-consolidated.json`.
- Deduplicate songs by normalized `title + artist`.
- Preserve playlist provenance for every song in the `playlists` array.

## Search Ledger Rules

- Store BPM Supreme search output in `collection/bpm-supreme-apple-music-search-results.json`.
- Keep every search result, including misses. Do not discard `no-results`, `missing-or-bad-match`, `no-match`, `bad-match`, `search-results-review-needed`, or `search-error` entries.
- Before starting a batch, load prior results from:
  - `collection/bpm-supreme-miri-jack-links.json`
  - `collection/bpm-supreme-apple-music-search-results.json`
- Skip tracks previously marked as no usable BPM Supreme result:
  - `no-results`
  - `missing-or-bad-match`
  - `no-match`
  - `bad-match`
- Carry forward previously matched or crate-added tracks instead of re-searching them unless the user explicitly asks for a retry.

## Rate Limit And Pacing

- Do not run quick bursts of BPM Supreme searches.
- Queue each song as a paced action window of at least 15 seconds.
- Spread the work inside that 15-second window: navigate/search, allow the page to settle, read results, checkpoint, then wait until the window has elapsed before the next search begins.
- Do not treat pacing as a fast search followed by an idle pause. The next search must not start until at least 15 seconds after the previous song's search action began.
- Use small batches. Prefer 10 songs per batch while the site is rate limiting.
- Checkpoint after every song, and at minimum after every 5 songs.
- If BPM Supreme starts showing inconsistent empty states, slow down further and re-check one known-good query before continuing.

## BPM Search Method

- Use a fresh BPM Supreme tab for each batch session.
- Search with `title + artist`, normalized by removing punctuation and curly quotes without inserting spaces. For example, `ain't` becomes `aint`.
- Search URL pattern:
  - `https://app.bpmsupreme.com/d/search?searchTerm=<encoded query>&type=tracks&library=main`
- Wait for the search page to settle before reading results.
- Treat a result as a real miss only when the page has settled and shows an empty/no songs state.

## Crate Add Criteria

Only add a track to crate when all required checks pass:

- The BPM result is a strong match for the Apple Music target.
- The normalized BPM result title matches the target title, or is an obvious version/edit of the same song.
- The target artist, featured artist, or a clearly equivalent primary artist appears in the BPM result artist list.
- Always expand the matched BPM row using the row caret before attempting any crate action.
- Add to crate from the expanded matched row controls, not from the collapsed-row quick action.
- After expansion, hover the selected nested version row itself and click that version row's `Add to Crate` control. Do not use the top-level track row `Add to Crate` button when nested version rows are available.
- Verify confirmation from the same nested version row, preferably by checking that its crate control changes to `Remove from Crate` or by capturing the success toast.
- Copy the BPM Supreme direct track/detail link for every crate-added track and save it immediately in both the search ledger and the public collection row.
- When copying a BPM Supreme track/detail link, do not click the cover art or any play target. Hover the matched row if needed, click only the far-right row ellipsis, then choose `Copy Link` from that menu.
- Store the copied direct URL as `source`, `bpmSupremeAlbumUrl`, and `bpmSupremeTrackUrl` for the collection table so the visible collection link opens the track/detail page directly.
- If the expanded row does not expose a copy/share track link, capture the matched track's BPM Supreme album/detail URL, usually `/d/album/<id>?library=main`, and save it as `bpmSupremeAlbumUrl`/`bpmSupremeTrackUrl`. Do not use the search URL as the public collection link when a detail URL can be captured.
- After a track is successfully added to crate, immediately add/mark it for the collection table workflow with the direct BPM link included.
- Prefer DJ-ready versions when available:
  - Intro clean/dirty versions: `IC`, `ID`, `CE`, `DE`, `CSE`, `DSE`
  - Quick hit versions: `QHC`, `QHD`
  - Clean radio/main versions: `C`, `CE`
- Capture BPM, key, genre, matched title, matched artist, version codes, BPM Supreme search URL, and BPM Supreme track URL before adding.
- If the result is plausible but not exact, mark it `search-results-review-needed` instead of adding to crate.
- Do not add crate entries for generic remixes, mashups, bootlegs, or edits unless the target song identity and artist relationship are clear.
- Do not add a track when the search only returns unrelated covers, different songs with the same title, or artist-only broad matches.

## Status Meanings

- `search-match` - Search returned a strong/exact usable match.
- `search-results-review-needed` - Search returned results, but the best match needs human review.
- `no-results` - BPM Supreme returned no usable song results after page settle.
- `search-error` - Browser or page issue interrupted the search; retry later.
- `crate-added` - Track was confirmed added to crate.
- `missing-or-bad-match` - Prior search found no usable result or only bad matches.

## Current Restart Checkpoint

The current restarted batch checkpoint was saved after 25 fresh searches:

- 567 unique Apple Music songs.
- 4 known misses skipped.
- 5 previous matches carried forward.
- 558 fresh BPM searches needed.
- 25 fresh searches completed.
- Completed result counts:
  - 7 `search-match`
  - 1 `search-results-review-needed`
  - 17 `no-results`

Resume from `freshSearchesCompleted` in `collection/bpm-supreme-apple-music-search-results.json`, not from memory.
