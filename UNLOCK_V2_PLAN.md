# Emote Unlock V2 — Implementation Plan

Derived from `unlockV2.md` (requirements) + mockups, reconciled against the code at HEAD.

## Summary

Today the app is **one challenge per dropped asset**: a flat data object with a single
`unlockType`/`itemId`/`questionType`/`stats`, four routes, and two large components
(`UnlockView.tsx` 373 lines, `AdminView.tsx` 664 lines) toggled by a boolean in `PageContainer.tsx`.

V2 makes **the drop the unit**. A drop is one complete current-style configuration plus an optional
date window and upcoming-visibility flags. Nearly every server file and both large components get
restructured. The challenge-answer flow itself does not change — it gets scoped to a drop id.

V2 also adds **Badge** as a third unlock type, and restructures the student view into four bands.

---

## Phase 1 — Data model, migration, stats

### Dropped asset data object

```ts
{
  schemaVersion: 2,
  timezone: string,              // default "America/Chicago"; window evaluation + admin display
  statsOwnerAssetId: string,     // see "Template-carried stats" below
  drops: {                       // keyed map, NOT an array
    [dropId]: {
      id: string,
      unlockType: "emote" | "accessory" | "badge",

      // emote
      itemId?, itemName?, itemPreviewUrl?,
      // accessory
      packId?, accessoryIds?: string[],
      // badge
      badgeId?, badgeName?, badgeIcon?,

      itemDescription: string,   // the question / prompt

      questionType: "text" | "open_text" | "multiple_choice" | "all_that_apply",
      password?: string,
      options?: string[],
      correctAnswers?: number[],

      startDate?: string | null, // date-only; null/absent on both = always available
      endDate?: string | null,
      showInUpcoming: boolean,   // default false
      upcomingDisplay: "item" | "mystery",

      createdAt: string,
      updatedAt: string,

      stats: { attempts: number, unlockCount: number },
      responses?: { [profileId]: { displayName, response, respondedAt } }, // open_text only
    }
  }
}
```

**A keyed map, not an array.** The requirements say "ordered list", but the order is _derived_
(always-available pinned first, then by start date) so nothing needs to be stored. A map lets
`updateDataObject` write dotted paths (`drops.{dropId}.stats.attempts`) the way the current code
already does for `stats.attempts`. An array would force read-modify-write of the whole collection on
every student attempt — a live race the moment two students answer at once.

### Per-visitor claims → visitor data object

```ts
claims: { [assetId]: { [dropId]: string /* ISO */ } }
```

Visitor scope is already per-player-per-world, which is the right granularity. Size is bounded by
drop count (dozens), not by class size. The `assetId` namespace keeps two instances of the app in one
world from colliding, and gives each world its own claim slate when the asset is copied.

Rejected alternative: deriving ownership from `visitor.fetchInventoryItems()` and storing no claims.
It conflates "claimed this drop" with "already owned this item from elsewhere" — a student who
already had the pumpkin emote would show the drop as claimed without answering — and has no clean
answer for partially-owned multi-accessory drops.

### Aggregate stats: two consequences

1. **`unlockCount` needs the claim record to dedupe.** `successfulUnlocks[profileId]` deduped
   structurally; a bare counter cannot. `/unlock/attempt` must check the visitor's claim record first
   and skip the increment if the drop is already claimed, or one student can inflate
   "★ n users unlocked" by replaying the request.

2. **Template-carried stats must be zeroed.** Defaults ship by an admin configuring + saving the key
   asset's data object and dropping that asset into a new world — so the data object travels with
   config _and_ stats, and a fresh world would open showing the original world's counts. On init, if
   `statsOwnerAssetId !== droppedAsset.id`, zero every drop's `stats` and `responses`, keep all
   config, stamp the current id. Runs inside the existing lock guard.

### Migration

Extend `initializeDroppedAssetDataObject.ts`: when legacy fields (`emoteId` / `itemId` /
`accessoryIds` / `unlockType`) exist and `drops` does not, wrap them into a single always-on drop.
Existing `stats.successfulUnlocks` collapses to `unlockCount = Object.keys(...).length`; `attempts`
carries over; `responses` carries over. Legacy top-level fields stay readable but are never written
again — the same pattern the app already uses for `emote*` → `item*`.

### Dates

- `endDate` is **inclusive through end-of-day** in the instance timezone. (The requirements' `< end`
  is exclusive, but the UI reads `Oct 1 – Oct 31` / `Ends Oct 31`; inclusive matches what admins and
  students see. Settled.)
- Windows are evaluated **server-side only**, in the instance `timezone`. Never the client clock —
  device clocks would otherwise gate content.

---

## Phase 2 — Server: drop-scoped state and projection

Rewrite `handleGetGameState.ts` to return the four bands, all computed server-side:

```ts
{ upcoming: [...<=3], recentDrops: [...<=3, each { claimed }], active: [...], isAdmin, timezone, success }
```

- `active` — live drops sorted soonest-ending-first, then always-available drops. **Excludes drops
  this visitor has already claimed.**
- `recentDrops` — 3 most recently ended, never padded, each flagged claimed/missed.
- `upcoming` — next 3 by start date among drops with `showInUpcoming`.

### Redaction

Today this is a shallow `delete dataObject.password` on the whole object. With drops it needs a real
per-drop projection, because visibility is **state-dependent**, not just flag-dependent:

| Drop state              | Student payload may contain                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Upcoming, untagged      | _nothing — omit the drop entirely_                                                                                  |
| Upcoming, `mystery`     | unlock type + dates only; **no item name, preview, or question**                                                    |
| Upcoming, `show item`   | item name + preview + dates                                                                                         |
| Live / always-available | full config minus `password` and `correctAnswers`                                                                   |
| Ended                   | item name + preview only (the greyed tooltip needs the name — including for drops that were mystery while upcoming) |

One `cleanDrop(drop, state)` helper, used on every student-facing path. Admin responses
skip it.

### Server-side admin gating

The README already flags that `/unlock/config` and `/unlockables` succeed for any authenticated
visitor. Today's blast radius is one config; after V2 a student could rewrite or delete the entire
schedule and wipe every drop's stats. Gate all admin routes on `visitor.isAdmin`. `sdk-badges` has
precedent and tests for this.

---

## Phase 3 — Server: routes and badges

| Route                           | Purpose                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `GET /game-state`               | student/admin bands (Phase 2)                                  |
| `GET /drops`                    | admin list: derived status + per-drop counts                   |
| `POST /drops`                   | create (blank, from `+ Add drop`)                              |
| `PUT /drops/:dropId`            | save editor; validates end-after-start, item set, question set |
| `DELETE /drops/:dropId`         | delete                                                         |
| `POST /drops/:dropId/duplicate` | full config, dates cleared                                     |
| `POST /unlock/attempt`          | **now takes `dropId`**; re-validates the window server-side    |
| `GET /unlockables`              | emotes + accessory packs + **badges**                          |

`/unlock/config` is replaced by the CRUD routes. `/unlock/attempt` must reject an attempt on a drop
that is not currently claimable — otherwise a student can POST an upcoming or ended `dropId` and
claim early or late.

### Badges

Per `sdk-ai-boilerplate/.ai/examples/badges.md`:

- **List:** inventory items where `type === "BADGE" && status === "ACTIVE"`, sorted by
  `metadata.sortOrder`. Reuse `getBadges.ts` from the example verbatim — it is built on the same
  `getCachedInventoryItems` this app already has, so listing badges costs no extra API call.
- **Grant:** `visitor.grantInventoryItem(badge, 1)` — the same call the accessory path already uses,
  so the grant branch is a near-copy of the accessory branch with a single item instead of a list.
  (Not `User.grantInventoryItem`; that variant is for admin-awards-to-another-player.)
- Toast + Sparkle particle on success; `badge_granted` analytics; 409 → "Already Unlocked".
- **No profile references** anywhere in copy.

---

## Phase 4 — Client: student view

`Home.tsx` becomes the band layout. `UnlockView.tsx` splits into:

| Component          | Notes                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UpcomingStrip`    | <=3 entries: `"🦃 Turkey emote — Nov 1 to Nov 30"` / `"❓ Mystery emote — ..."`. **Design bar: slim enough that the first challenge card is visible without scrolling.** If that cannot be met, the strip moves below the feed. |
| `RecentDropsStrip` | <=3 thumbnails, never padded, full-color vs. greyed, name tooltip on greyed, band absent at zero.                                                                                                                               |
| `ChallengeCard`    | Extracted near-as-is from today's `UnlockView`: preview, question, four answer UIs, wrong-answer shake, `★ n users unlocked`. Adds the `Ends [date]` (amber) / `Always available` (blue) chip.                                  |
| `SuccessCard`      | New. Shows **the actual reward** — today's card shows nothing. Per-type copy; accessories list every item.                                                                                                                      |
| `EmptyState`       | Reuses the existing lock SVG with the "No current unlock challenges available!" copy.                                                                                                                                           |

**Band ④ position.** The mockups look contradictory (mockup 1 puts the success card at the bottom;
6–8 put it above the active challenge), but "flips that card in place" explains all four: the success
card sits at the claimed drop's own position in the feed. No separate band to build.

**"Unlocked this session"** is client-only: a `unlockedThisSession: Set<dropId>` in context, filled
from successful attempt responses. The server already excludes claimed drops from `active`, so these
render as success cards for this drawer mount only. Reopen the drawer and a claimed live drop is
simply absent from band ③; once it ends it appears full-color in Recent Drops.

---

## Phase 5 — Client: admin view

`PageContainer`'s boolean `showSettings` becomes a three-way view state
(`home | list | editor:dropId`); the gear opens the list, the back arrow returns.

- **`DropsList`** — one row per drop: emoji + name · date range (or "No dates") · question type ·
  status chip with count (`Always on · n` / `Live · n` / `Ended · n` / `Upcoming`) ·
  visibility icon (👁 / ❓ / none). Always-available pinned first, then by start date. `+ Add drop`.
- **`DropEditor`** — today's `AdminView` scoped to one drop, plus:
  - `UnlockWindow` card — "Always available (no dates)" checkbox; unchecked reveals start/end.
  - `ShowInUpcoming` card — default off; nested radio `Show the item` (default) / `Mystery`.
  - `BadgePicker` — single-select, preview after selection, helper copy "One badge per drop."
  - `Duplicate` / `Preview` / per-drop `Engagement` (Attempts / Unlocked).
- **`Preview`** — reuse `ChallengeCard` with an `isPreview` prop that disables submission. Satisfies
  the mandatory admin test check.
- Option builder, question-type switching, accessory multi-select, and the open-text response table
  all carry over unchanged.

Admin home is unchanged from the student view except for the gear button.

---

## Phase 6 — Analytics

Existing six names kept, plus `badge_granted`, `unlock_app_opened`, `next_unlock_viewed`,
`recent_drops_viewed`, `drop_config_changed`.

Each carries only `analyticName` / `profileId` / `uniqueKey` / `urlSlug` — what the analytics option
on `updateDataObject` actually accepts. **No arbitrary event properties.** Per-drop numbers come from
the Engagement panel reading `drops.{dropId}.stats`.

The three view events fire from `/game-state`, which already knows which bands it is returning — no
separate beacon routes.

---

## Out of scope

- **"Publish to world Events calendar"** — gated on the Platform Events discovery; deferred.
- **`Load default schedule` button / defaults endpoint / `default_schedule_loaded` event** — defaults
  arrive via the pre-saved data object travelling with the asset; the admin edits from there.

## Settled decisions

| Question              | Resolution                                                                        |
| --------------------- | --------------------------------------------------------------------------------- |
| `endDate` inclusivity | Inclusive through end-of-day, instance timezone                                   |
| Timezone source       | Instance-level field, default `America/Chicago`, evaluated server-side            |
| "This session"        | This drawer mount; claimed drops are absent on reopen, not shown as success cards |
| Badge type / grant    | `type === "BADGE" && status === "ACTIVE"`; `visitor.grantInventoryItem`           |
| Asset-level stats     | Aggregate only (`attempts`, `unlockCount`); claims on the visitor data object     |
| Default schedule      | Pre-saved data object travels with the asset; no import UI                        |

## Manual test plan

No test harness exists in this app (`sdk-badges` has one; this app does not).

1. Legacy install opens as a single always-on drop with stats carried over.
2. A drop with no dates behaves exactly like today's app.
3. Live window boundaries: day before start, first day, last day, day after end — in the instance
   timezone, verifying the inclusive end date.
4. Mystery upcoming drop: confirm the network payload contains no item name, preview, or question.
5. Untagged upcoming drop: confirm it is absent from the payload entirely.
6. Ended + missed drop: greyed thumbnail, tooltip reveals the name (including for a former mystery).
7. Claim a drop → success card flips in place; reopen the drawer → card absent, not a success card.
8. Replay `/unlock/attempt` for an already-claimed drop → `unlockCount` does not increment.
9. POST an upcoming and an ended `dropId` to `/unlock/attempt` → both rejected.
10. Non-admin hits every admin route → all rejected.
11. Configure + save, drop the asset in a new world → config present, all counts zero.
12. All four question types × all three unlock types grant correctly; 409 paths show "Already
    Unlocked" with no particle.
13. Empty state replaces band ③ while ① and ② still render.
14. Preview renders the drop as a student sees it and cannot submit.
