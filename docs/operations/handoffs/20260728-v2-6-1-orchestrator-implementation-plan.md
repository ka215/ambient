# v2.6.1 Orchestrator Implementation Plan

Date: 2026-07-28
Target release: v2.6.1
Source requirement: `.codex/memo.md`
Requirement status: fixed by user confirmation on 2026-07-28.
Scope: planning only. No source implementation in this step.

## 1. Scope Summary

v2.6.1 covers two items.

1. Bug fix: In cloud mode (`AMP_ENV=cloud`), media added to localStorage MyPlaylist is saved under `New Category` instead of the currently selected category.
2. Feature addition: Add category edit/delete controls under Options modal > Playlist Management, below the existing Add New Category section.

Existing architecture after v2.6.0 is modularized. The implementation should keep the current layer boundaries:

- Domain logic: `src/scripts/domain/*`
- UI form binding and view state: `src/scripts/ui/forms/*`
- Bootstrap wiring: `src/scripts/bootstrap/*`
- Server-rendered form markup: `views/collapse.php`
- i18n strings: `assets/langs/*.json`
- Regression tests: `tests/e2e/scenarios/*`

## 2. Item 1: Bug Fix Plan

### 2.1 Current Observation

Relevant files:

- `src/scripts/domain/media-management-data.ts`
- `src/scripts/ui/forms/media-management.ts`
- `src/scripts/ui/forms/management-forms.ts`
- `src/scripts/bootstrap/playlist-ui-init.ts`
- `src/scripts/bootstrap/playlist-session-init.ts`
- `src/scripts/domain/myplaylist-storage.ts`

Current media item construction in `buildManagedMediaItem()` falls back to `AUTO_CATEGORY_NAME = 'New Category'` when:

- submitted `category` value is empty, or
- no `category` payload is present.

The media management submit handler currently derives `preferredCategoryValue` from either:

- `media-category-new`, when category select is hidden, or
- `media-category`, when category select is visible.

However, the actual `addMediaData(Array.from(formData.entries()))` receives the raw form data. If the visible select is not synchronized to the active filtered category, or if reset/update order clears the category before persistence/UI refresh is complete, `buildManagedMediaItem()` treats the category as empty and routes the item into `New Category`.

### 2.2 Root Cause Hypothesis

The most likely root cause is not localStorage serialization itself. It is category resolution before append:

1. The add-media drawer entry correctly passes the active category id into `openMediaManagement(categoryId)`.
2. `syncMediaCategoryField(preferredCategoryId)` is expected to select that category in `#media-category`.
3. On submit, the form payload may still contain empty `category`, or category resolution may rely only on the UI field rather than a normalized preferred category id.
4. `buildManagedMediaItem()` then creates or uses `New Category`.

### 2.3 Fix Policy

Fix category resolution at the domain boundary so the save path is deterministic.

Recommended changes:

1. Extend `BuildMediaItemOptions` with an optional `preferredCategoryId?: number | null`.
2. In `buildManagedMediaItem()`, resolve category in this priority order:
   - explicit valid `category` form value
   - valid `preferredCategoryId`
   - `category_new_name` when no categories exist / text field mode is active
   - existing `New Category` fallback only when no valid target exists
3. In `bindMediaManagementForm()`, capture the currently active category id before form reset/update and pass it through `addMediaData`.
4. Update the bootstrap binding for `addMediaData` if needed so it can accept `{ payload, preferredCategoryId }` without leaking UI details into the domain.
5. Preserve existing behavior for first MyPlaylist registration with no categories: text field mode creates `New Category` from `media-category-new`.
6. Preserve local mode behavior and cloud JSON read-only restrictions.

### 2.4 Acceptance Criteria

1. In cloud mode with MyPlaylist selected and target category `Alpha` selected, adding media from the drawer or options modal appends the item under `Alpha`.
2. `New Category` is not created unless there is no valid selected category and no valid new-category text input.
3. localStorage `AmbientMyPlaylist` stores the new item under the selected category key.
4. The playlist drawer refreshes immediately and shows the item when the same category filter is active.
5. Existing initial empty MyPlaylist flow still creates the first category through text input.
6. Existing local mode media add flow still works.

### 2.5 Suggested Regression Tests

Add to `tests/e2e/scenarios/sc-010-cloud-myplaylist-regression.spec.ts`:

- Seed MyPlaylist with categories `Alpha` and `Beta`.
- Select target category `Beta`.
- Open media management from the playlist drawer add action.
- Add a YouTube media item.
- Assert:
  - `AmbientMyPlaylist.Beta` contains the new title.
  - `AmbientMyPlaylist["New Category"]` is undefined.
  - `#target-category` remains `Beta`.
  - playlist drawer shows the new item under the active filter.

Run:

- `npm run typecheck`
- `npm run build`
- `npm run test:e2e:cloud:chrome -- --grep "selected category|Cloud MyPlaylist"`

## 3. Item 2: Feature Requirements

### 3.1 Functional Requirements

Add `Edit Category` section below `Add New Category` in Options modal > Playlist Management.

Behavior:

1. Hide the entire `Edit Category` section when the current playlist has no categories.
2. Show a category select as the initial UI when categories exist.
3. The first select option is a placeholder: `Choose a category`.
4. When a real category is selected:
   - show a category rename text field.
   - placeholder: `New category name`.
   - show the number of media items in that category.
   - show right-aligned `Update` and `Delete` buttons below the text field.
5. `Delete` is enabled only when the selected category has zero media items.
6. Delete action must revalidate media count at click time.
7. `Update` or `Delete` runs the category update process.
8. Show result with toast.
9. After success, reset the Edit Category section.
10. After delete, if no categories remain, hide the section.

### 3.2 Data Rules

Category rename:

- Trim input.
- Required.
- Sanitize using the same max length policy as category creation / media category fields.
- If the new name equals the current name after trimming, disable the Update button.
- If the new name conflicts with an existing category, reject the update and show an error toast. Do not auto-suffix on edit because rename must be explicit and predictable.
- Rename must preserve all media items in that category by keeping their `catId` unchanged and replacing the category name in `status.category[index]`.

Category delete:

- Allowed only when `status.media` has no item whose `catId` equals the selected category index.
- Delete removes `status.category[index]`.
- Because deletion is only allowed for empty categories, media `catId` remapping is not required for the deleted category itself. However, categories after the deleted index shift left; existing media with `catId > deletedIndex` must be decremented by 1 to preserve their category association.

Persistence:

- Call `persistMyPlaylistIfNeeded()` after successful update/delete.
- In cloud MyPlaylist, this updates localStorage.
- In local mode, this should keep the existing current-playlist persistence behavior.
- In cloud JSON playlists, category edit/delete controls must remain disabled. Cloud mode allows category editing only for the localStorage MyPlaylist.

UI synchronization after success:

- Update `status.category`.
- Update `status.media` when delete shifts category ids.
- Run category UI refresh (`clearCategory()` + `updateCategory()` or equivalent existing helper path).
- Run playlist display refresh (`updatePlaylist()`).
- Reset edit section selected value, input value, media count, buttons, validation state.

## 4. Detailed Design Proposal

### 4.1 Domain Layer

Extend `src/scripts/domain/playlist-management-data.ts` with pure helpers:

- `renameCategory(categories, currentIndex, nextName)`
- `deleteEmptyCategory(categories, mediaItems, currentIndex)`
- `getCategoryMediaCount(mediaItems, categoryIndex)`
- `isDuplicateCategoryName(categories, nextName, ignoreIndex)`

Expected return shape:

```ts
type CategoryMutationResult = {
  ok: boolean;
  categories: string[];
  mediaItems?: MediaItem[];
  messageKey?: string;
  reason?: 'empty-name' | 'duplicate' | 'not-found' | 'not-empty' | 'unchanged';
};
```

Extend `src/scripts/domain/playlist-management-actions.ts` with:

- `renamePlaylistCategoryAction(...)`
- `deletePlaylistCategoryAction(...)`

These actions should:

- read or receive the selected index and new name.
- call the pure helper.
- update state through callbacks.
- persist through `persistMyPlaylistIfNeeded`.
- return `{ ok, message }` for toast rendering.

### 4.2 UI Layer

Update `views/collapse.php` below `#playlist-management-field-category`:

- Add wrapper: `#playlist-management-field-category-edit`
- Add select: `#category-edit-target`, `name="category_edit_target"`
- Add text input: `#category-edit-name`, `name="category_edit_name"`
- Add count display: `#category-edit-media-count`
- Add buttons:
  - `#btn-update-category`, `name="update_category"`
  - `#btn-delete-category`, `name="delete_category"`
- Add localized data messages for success/failure/duplicate/not-empty.

Update `src/scripts/ui/forms/playlist-management.ts`:

- Bind select change.
- Populate/reset edit UI based on current categories.
- Validate rename input on input/change.
- Enable Update when selected category exists and input is valid/different.
- Enable Delete only when selected category media count is zero.
- On Update/Delete click, call domain action and toast the result.

Update `src/scripts/ui/forms/management-forms.ts`:

- Add helper to sync category edit select/options.
- Add helper to reset category edit controls.
- Ensure existing `clearCategoryView()` / `updateCategoryView()` also refreshes the edit section.

Update `src/scripts/ui/forms/management-binding-builders.ts` and `src/scripts/bootstrap/management-init.ts`:

- Pass new action callbacks and state getters into playlist management bindings.

### 4.3 Bootstrap / State Wiring

Use existing `createPlaylistManagementActions()` as the action composition point.

Required additional dependencies:

- `getCategories()`
- `setCategories(categories)`
- `getMediaItems()`
- `setMediaItems(mediaItems)`
- `persistMyPlaylistIfNeeded()`
- `onCategoryChanged()` callback equivalent to:
  - `clearCategory()`
  - `updateCategory()`
  - `updatePlaylist()`
  - optional `syncPlaybackAfterMediaAdd()` is not required for category rename/delete unless current media context display depends on category label.

If no existing single callback covers this, add a narrowly named callback such as `onCategoriesMutated()`.

### 4.4 i18n

Add keys to all language files under `assets/langs/`:

- `Edit Category`
- `Choose a category`
- `New category name`
- `Media count`
- `Update Category`
- `Delete Category`
- `Category updated successfully.`
- `Failed to update category.`
- `Category deleted successfully.`
- `Failed to delete category.`
- `This category contains media and cannot be deleted.`
- `A category with this name already exists.`
- `Category name is required.`

Japanese locale wording should match the current UI style for the same labels.

### 4.5 Styling

Use existing Flowbite/Tailwind form classes already used in `views/collapse.php`.

UI placement recommendation:

- Select first.
- Rename input below the select.
- Media count as compact text beside or below the input. For mobile safety, place it below/right within the same block rather than forcing a tight horizontal layout.
- Buttons in a right-aligned flex row.
- Hide the rename/count/button block while placeholder is selected.

## 5. Implementation Slices

### Slice A: Bug Fix

1. Add focused E2E reproduction for selected-category media add.
2. Fix category resolution in `domain/media-management-data.ts` and binding path.
3. Verify no regression in empty MyPlaylist first-add flow.

### Slice B: Domain Category Mutation

1. Add pure helpers in `playlist-management-data.ts`.
2. Add actions in `playlist-management-actions.ts`.
3. Typecheck domain changes.

### Slice C: UI Markup and Binding

1. Add category edit markup in `views/collapse.php`.
2. Extend playlist management bindings.
3. Add sync/reset helpers for edit section.
4. Wire actions in bootstrap.

### Slice D: i18n and Styling

1. Add translation keys to all `assets/langs/*.json`.
2. Add any minimal SCSS only if existing utility classes are insufficient.
3. Run i18n coverage check.

### Slice E: Verification

1. Add E2E tests for edit/delete.
2. Run typecheck/build.
3. Run targeted cloud/local E2E.

## 6. Test Plan

### 6.1 Automated Checks

Required:

- `npm run typecheck`
- `npm run build`
- `npm run check:i18n`
- `npm run test:e2e:cloud:chrome`
- `npm run test:e2e:local:chrome`

Targeted during development:

- `npx playwright test tests/e2e/scenarios/sc-010-cloud-myplaylist-regression.spec.ts --project=chrome`
- `npx playwright test tests/e2e/scenarios/sc-007-management.spec.ts --project=chrome`

### 6.2 E2E Scenarios To Add

Bug fix:

- Cloud MyPlaylist media add respects currently selected category.

Category edit:

- Section hidden when playlist has no categories.
- Section visible when categories exist and select has placeholder first.
- Selecting a category reveals rename input, media count, Update/Delete buttons.
- Rename empty category succeeds and persists.
- Rename populated category succeeds and preserves media item association.
- Rename to duplicate category is rejected.
- Delete empty category succeeds and persists.
- Delete category containing media is disabled and still rejected if forced by JS click.
- After deleting last category, section hides.
- Cloud JSON playlist keeps edit controls disabled.

### 6.3 Manual Smoke Checks

1. Cloud MyPlaylist:
   - create first category through first media add.
   - add second category.
   - switch target category and add media.
   - rename category.
   - delete empty category.
   - reload and confirm localStorage state.
2. Local environment:
   - open existing JSON playlist.
   - add category.
   - rename category.
   - delete empty category.
   - export JSON and inspect category names.
3. Responsive:
   - desktop width.
   - iPhone/iPad Playwright projects if time allows.

## 7. Risks and Mitigations

Risk: Deleting a category shifts category indexes and can orphan media.
Mitigation: Only allow deleting empty categories and decrement `catId` for media after the deleted index.

Risk: Rename conflicts with existing categories.
Mitigation: Reject duplicate names explicitly instead of auto-renaming.

Risk: UI category selects become stale after mutation.
Mitigation: Centralize refresh through existing `clearCategory()` + `updateCategory()` flow and add category edit sync to that flow.

Risk: Cloud JSON playlists accidentally become editable.
Mitigation: Reuse `canMutateCurrentPlaylist()` and `applyCloudEditRestrictions()` in both UI disabled state and click-time action guard.

Risk: i18n coverage fails.
Mitigation: Add all new labels/messages to every file in `assets/langs/`.

## 8. Definition of Done

1. Bug fix acceptance criteria pass.
2. Category edit/delete functional requirements pass.
3. TypeScript typecheck passes.
4. Vite build passes.
5. i18n coverage passes.
6. Targeted E2E scenarios pass in cloud and local modes.
7. No unrelated refactor or behavior drift is introduced.
