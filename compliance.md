# Accessibility Compliance Report
## EarthRISE Air Quality Sampler

| Field | Value |
|---|---|
| **Standard** | Section 508 / WCAG 2.2 Level A & Level AA |
| **Test Tool** | pa11y 9.1.1 (runners: htmlcs + axe 4.11) |
| **Test Date** | 2026-07-23 |
| **URL Tested** | `http://127.0.0.1:8123/` (main dashboard) |
| **Overall Status** | ❌ **NOT COMPLIANT** — 9 unique errors found |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Test Configuration](#2-test-configuration)
3. [Errors — Conformance Failures](#3-errors--conformance-failures)
4. [Warnings — Likely Violations](#4-warnings--likely-violations)
5. [Notices — Manual Checks Required](#5-notices--manual-checks-required)
6. [WCAG 2.2-Specific Criteria](#6-wcag-22-specific-criteria-not-covered-by-automated-testing)
7. [Issue Count Summary](#7-issue-count-summary)
8. [Remediation Recommendations](#8-remediation-recommendations)
9. [Raw pa11y Output](#9-raw-pa11y-output)

---

## 1. Executive Summary

The automated accessibility audit of the EarthRISE Air Quality Sampler web application identified **9 unique conformance failures** (errors) against WCAG 2.2 Level A and Level AA, plus **numerous warnings** requiring manual review. The application is a single-page geospatial dashboard built on Django + Leaflet.js with Bootstrap 5.

The most critical issues are:
- **5 unlabeled form controls** (opacity sliders, date picker, timeline slider) — critical impact, affects all screen reader users
- **1 unlabeled speed selector** — critical impact
- **No skip navigation mechanism** — serious impact, affects keyboard-only users
- **Color contrast failure** on Layer Manager panel title
- **Interactive `onclick` divs** not reachable by keyboard (`#lm-header`, `#lm-basemap-header`)

Many map tile images (`<img alt="">`) intentionally have empty `alt` attributes and are correctly marked decorative for Leaflet tile rendering — these warnings are expected and acceptable per WCAG technique H67.

---

## 2. Test Configuration

```
pa11y 9.1.1
  --standard WCAG2AA
  --runner htmlcs
  --runner axe
  --include-notices
  --include-warnings
  --timeout 90000
  --wait 4000
  http://127.0.0.1:8123/
```

**Runners used:**
- **htmlcs** — HTML_CodeSniffer, maps directly to WCAG 2.x success criteria codes
- **axe** — Deque axe-core 4.11, additional rule coverage with dequeuniversity references

**Note on WCAG 2.2:** pa11y's `WCAG2AA` standard currently maps to WCAG 2.1 Level AA. WCAG 2.2 adds nine new success criteria (see [Section 6](#6-wcag-22-specific-criteria-not-covered-by-automated-testing)); automated tooling does not yet fully cover them. Manual review of those criteria is required for complete WCAG 2.2 conformance.

**Note on Section 508:** The Revised Section 508 Standards (2017) incorporate WCAG 2.0 Level A and AA by reference. Conforming to WCAG 2.2 Level AA satisfies and exceeds current Section 508 requirements.

---

## 3. Errors — Conformance Failures

These are definite violations that must be remediated for compliance.

---

### ERROR 1 — Opacity Sliders Missing Accessible Names
**WCAG Criteria:** 4.1.2 Name, Role, Value (Level A) | 1.3.1 Info and Relationships (Level A)
**Impact:** Critical
**Runner:** htmlcs + axe
**Affected Elements (3):**

| Element | Selector |
|---|---|
| CO 500 opacity slider | `#layer-list > li:nth-child(1) > div:nth-child(2) > input[type=range]` |
| Aerosol opacity slider | `#layer-list > li:nth-child(2) > div:nth-child(2) > input[type=range]` |
| MODIS opacity slider | `#layer-list > li:nth-child(3) > div:nth-child(2) > input[type=range]` |

**pa11y code:** `WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.InputRange.Name` / `label`

**Issue:** Range `<input>` elements used for layer opacity control have no `aria-label`, `title`, or associated `<label>` element. Screen readers announce these as "slider" with no context.

**Fix:**
```html
<!-- Option A: aria-label -->
<input type="range" class="opacity-slider" min="0" max="100" value="85"
       data-id="co500" aria-label="CO 500 hPa layer opacity">

<!-- Option B: aria-labelledby pointing to the layer name span -->
<input type="range" class="opacity-slider" min="0" max="100" value="85"
       data-id="co500" aria-labelledby="layer-label-co500" aria-label="Opacity">
```

---

### ERROR 2 — Date Picker Missing Accessible Name
**WCAG Criteria:** 4.1.2 Name, Role, Value (Level A) | 1.3.1 Info and Relationships (Level A)
**Impact:** Critical
**Runner:** htmlcs + axe
**Affected Element:** `#date-picker`

**pa11y code:** `WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.InputDate.Name` / `label`

**Context:**
```html
<input type="date" id="date-picker" value="2024-08-21" min="2015-01-01" max="2024-12-31">
```

**Issue:** The date input has no associated `<label>` and no `aria-label`/`title`. Screen readers cannot identify its purpose.

**Fix:**
```html
<label for="date-picker" class="sr-only">Select date</label>
<input type="date" id="date-picker" value="2024-08-21" min="2015-01-01" max="2024-12-31">
<!-- OR -->
<input type="date" id="date-picker" aria-label="Select map date"
       value="2024-08-21" min="2015-01-01" max="2024-12-31">
```

---

### ERROR 3 — Timeline Slider Missing Accessible Name
**WCAG Criteria:** 4.1.2 Name, Role, Value (Level A)
**Impact:** Critical
**Runner:** htmlcs + axe
**Affected Element:** `#timeline-slider`

**pa11y code:** `WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.InputRange.Name` / `label`

**Context:**
```html
<input type="range" id="timeline-slider" min="0" max="3650" value="3519">
```

**Fix:**
```html
<input type="range" id="timeline-slider" min="0" max="3650" value="3519"
       aria-label="Timeline date range" aria-valuetext="2024-08-21">
```

---

### ERROR 4 — Speed Selector Missing Label
**WCAG Criteria:** 4.1.2 Name, Role, Value (Level A) | 1.3.1 Info and Relationships (Level A)
**Impact:** Critical
**Runner:** htmlcs + axe
**Affected Element:** `#speed-select`

**pa11y codes:** `WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.Select.Name` / `WCAG2AA.Principle1.Guideline1_3.1_3_1.F68` / `select-name`

**Context:**
```html
<label class="tl-speed-label">SPEED</label>
<select id="speed-select">
    <option value="2000">0.5×</option>
    <option value="1000" selected>1×</option>
    ...
```

**Issue:** The `<label>` element is not associated with the `<select>` — it has no `for` attribute and does not wrap the control.

**Fix:**
```html
<label class="tl-speed-label" for="speed-select">SPEED</label>
<select id="speed-select">
```

---

### ERROR 5 — No Skip Navigation Mechanism
**WCAG Criteria:** 2.4.1 Bypass Blocks (Level A)
**Impact:** Serious
**Runner:** axe
**Affected Element:** `<html>` (page-level)

**pa11y code:** `bypass`

**Issue:** The page has no mechanism (skip link, heading structure, or landmark regions) to allow keyboard users to bypass the repeated Leaflet map controls and navigate directly to main content. The `<header>` exists but `<main>`, `<nav>`, and other ARIA landmark elements are absent.

**Fix:**
```html
<!-- Add skip link as first focusable element in <body> -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Wrap primary content -->
<main id="main-content">
  <!-- map, controls, etc. -->
</main>

<!-- CSS to show on focus -->
<style>
.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus {
  left: 0;
  top: 0;
  z-index: 9999;
  background: #fff;
  padding: 4px 8px;
}
</style>
```

---

### ERROR 6 — Color Contrast Failure: Layer Manager Title
**WCAG Criteria:** 1.4.3 Contrast (Minimum) (Level AA)
**Impact:** Serious (needs further review flagged by axe)
**Runner:** axe
**Affected Element:** `#lm-header > span` (Layer Manager title text)

**pa11y code:** `color-contrast`

**Issue:** The Layer Manager panel title (containing the layers icon and text) does not meet the minimum 4.5:1 contrast ratio required for normal-sized text against its background.

**Fix:** Ensure text in `.lm-title` has sufficient contrast. Use a tool like the WebAIM Contrast Checker to verify and adjust the foreground or background color to achieve ≥ 4.5:1 ratio.

---

### ERROR 7 — Interactive Divs Not Keyboard Accessible
**WCAG Criteria:** 2.1.1 Keyboard (Level A)
**Impact:** Serious
**Runner:** htmlcs
**Affected Elements (2):**

| Element | Selector |
|---|---|
| Layer manager toggle header | `#lm-header` |
| Basemap section toggle | `#lm-basemap-header` |

**pa11y code:** `WCAG2AA.Principle2.Guideline2_1.2_1_1.G90`

**Context:**
```html
<div id="lm-header" onclick="toggleLayerManager()">...</div>
<div class="lm-section-header" id="lm-basemap-header" onclick="toggleBasemapSection()">...</div>
```

**Issue:** These `<div>` elements use `onclick` for interaction but are not focusable by keyboard (no `tabindex`) and have no keyboard event handler. Keyboard-only users cannot activate them.

**Fix:**
```html
<!-- Option A: Convert to <button> -->
<button id="lm-header" onclick="toggleLayerManager()" aria-expanded="true"
        aria-controls="lm-body">
  <span class="lm-title">...</span>
</button>

<!-- Option B: Add tabindex and keydown handler -->
<div id="lm-header" onclick="toggleLayerManager()"
     tabindex="0" role="button" aria-expanded="true"
     onkeydown="if(event.key==='Enter'||event.key===' ')toggleLayerManager()">
```

---

### ERROR 8 — Leaflet Draw/Zoom Navigation Not in Landmark
**WCAG Criteria:** 1.3.1 Info and Relationships (Level A)
**Impact:** Moderate
**Runner:** htmlcs
**Affected Elements (4 toolbars):**

**pa11y code:** `WCAG2AA.Principle1.Guideline1_3.1_3_1.H48`

**Issue:** Leaflet draw toolbar links and zoom control links are grouped as visual navigation but not semantically marked as lists (`<ul>`/`<li>`). This is a Leaflet.js library-level issue.

**Note:** This is generated by Leaflet.js internals. Full remediation requires either overriding Leaflet's HTML output (advanced) or using a Leaflet accessibility plugin.

---

### ERROR 9 — Inline Color Without Complementary Property
**WCAG Criteria:** 1.4.3 Contrast (Minimum) (Level AA)
**Impact:** Minor
**Runner:** htmlcs
**Affected Elements:**
- Inline icon: `<i class="fas fa-plus-circle" style="color: var(--color-primary);">` — foreground set without background
- Layer swatches: `<span class="layer-swatch" style="background:#ff7043;">` — background set without foreground

**pa11y codes:** `WCAG2AA.Principle1.Guideline1_4.1_4_3_F24.F24.FGColour` / `F24.BGColour`

**Fix:** Ensure that wherever an inline `color` or `background-color` style is set, the complementary property is also specified or reliably inherited.

---

## 4. Warnings — Likely Violations

These issues are likely accessibility failures but require visual/contextual verification to confirm.

| # | Code | Issue | Elements | WCAG Criterion |
|---|---|---|---|---|
| W1 | `1_4_10.C32...` | `position: fixed` elements may require 2D scrolling on small viewports | `#nasa-header`, `#map`, `#loading-badge`, `#layer-manager`, `#timeline` | 1.4.10 Reflow (AA) |
| W2 | `1_4_3.G18.Alpha` | Transparent text/background — contrast ratio unverifiable | Header title, date badge, basemap labels, speed options, timeline range labels, attribution links | 1.4.3 Contrast (AA) |
| W3 | `1_4_3.G18.BgImage` | Text over background image (Leaflet draw tool icons) | Draw polygon/rectangle/edit/delete span labels | 1.4.3 Contrast (AA) |
| W4 | `1_1_1.H67.2` | Map tile `<img>` elements have `alt=""` — marked as decorative | Leaflet tile grid images | 1.1.1 Non-text Content (A) |
| W5 | `region` (axe) | Page content not contained in ARIA landmark regions | Layer manager, timeline, map controls, date picker | 1.3.6 Identify Purpose (AA) |

**On W4 (map tiles):** Empty `alt` on purely decorative tile images that convey no unique information is acceptable per WCAG H67. However, meaningful named data layers (CO 500 hPa, Aerosol Index) should have programmatic alternatives describing the data they represent.

**On W1 (fixed positioning):** The map (`#map`) and UI panels (`#layer-manager`, `#timeline`, `#nasa-header`) all use `position: fixed` or fill the viewport. On narrow viewports or with browser zoom at 400%, content may not reflow. Verify that at 320px CSS viewport width, all content and functionality remains accessible.

---

## 5. Notices — Manual Checks Required

pa11y cannot automatically verify these criteria. Manual review by a human tester with assistive technology is required.

| WCAG SC | Description | Manual Test |
|---|---|---|
| 1.1.1 (A) | Long text alternatives for complex images | Do the named data layers (CO, Aerosol, MODIS) have accessible descriptions explaining what the data represents? |
| 1.3.2 (A) | Meaningful sequence | Does the reading/tab order make sense when CSS is disabled? |
| 1.3.3 (A) | Sensory characteristics | Are instructions (e.g., "draw a polygon") conveyed without relying solely on visual shape or position? |
| 1.3.4 (AA) | Orientation | Does the app function in both portrait and landscape? |
| 1.4.1 (A) | Use of color | Is color the only means of conveying the layer swatch information? |
| 1.4.4 (AA) | Resize text | Is all text readable at 200% zoom without loss of content? |
| 1.4.5 (AA) | Images of text | Are there any images of text that could be real text? |
| 1.4.11 (AA) | Non-text contrast | Do UI component boundaries (sliders, buttons, inputs) have 3:1 contrast against their backgrounds? |
| 1.4.12 (AA) | Text spacing | Does content remain functional with increased line/letter/word spacing? |
| 1.4.13 (AA) | Content on hover/focus | Are tooltips/popups on hover dismissable, hoverable, and persistent? |
| 2.1.1 (A) | Keyboard | Can all map interactions (pan, zoom, draw, layer toggle, timeline play) be operated by keyboard alone? |
| 2.2.2 (A) | Pause, stop, hide | Does the timeline animation have a pause mechanism? (Play/pause button exists — verify it works with keyboard) |
| 2.3.1 (A) | Three flashes | Does the map animation produce no flashing faster than 3 Hz? |
| 2.4.1 (A) | Bypass blocks | After skip link fix, verify bypass mechanism works with screen reader |
| 2.4.3 (A) | Focus order | Is the tab order logical and follows visual flow? |
| 2.4.7 (AA) | Focus visible | Is keyboard focus indicator always visible on all interactive elements? |
| 2.5.1 (A) | Pointer gestures | Can all map interactions performed with multipoint gestures (pinch-zoom) also be done with single pointer? |
| 2.5.2 (A) | Pointer cancellation | Can pointer-down actions (e.g., draw polygon) be cancelled/aborted? |
| 2.5.3 (A) | Label in name | Do buttons with icon + visible label have accessible names that contain the visible label text? |
| 3.1.1 (A) | Language of page | `<html lang="en">` ✅ present |
| 3.2.1 (A) | On focus | Does focusing any element cause unexpected context changes? |
| 4.1.3 (AA) | Status messages | Are loading states (spinner badge) communicated to AT without focus? The `#loading-badge` should use `role="status"` or `aria-live`. |

---

## 6. WCAG 2.2-Specific Criteria (Not Covered by Automated Testing)

WCAG 2.2 introduced the following new success criteria beyond WCAG 2.1. These require **manual testing** as automated tools do not yet cover them fully.

| SC | Level | Title | Assessment |
|---|---|---|---|
| 2.4.11 | AA | Focus Appearance | Manually verify: keyboard focus indicator must have area ≥ perimeter of unfocused component × CSS px, and minimum 3:1 contrast ratio |
| 2.5.7 | AA | Dragging Movements | The map supports drag-to-pan. A single-pointer alternative must exist (e.g., zoom/pan by keyboard or arrow controls). Leaflet's keyboard navigation handles this. Verify. |
| 2.5.8 | AA | Target Size (Minimum) | All interactive targets should be at least 24×24 CSS pixels. Verify timeline buttons, layer toggle buttons, and opacity sliders meet this threshold. |
| 3.2.6 | AA | Consistent Help | If help is available, it must appear in a consistent location. Currently no help is present — N/A unless help is added. |
| 3.3.7 | AA | Redundant Entry | If any multi-step process requires re-entering information, auto-populate or accept previously entered values. N/A for this app's current scope. |
| 3.3.8 | AA | Accessible Authentication (Minimum) | No authentication in this app. N/A. |
| 2.4.12 | AAA | Focus Appearance (Enhanced) | AAA only — not required for Level AA conformance. |

**Key WCAG 2.2 risk areas for this app:**
- **2.4.11 Focus Appearance**: The NASA dark-themed UI may have insufficient focus indicator contrast on dark surfaces — manual verification required.
- **2.5.8 Target Size**: Timeline control buttons appear small. Measure and confirm ≥ 24px hit targets.
- **2.5.7 Dragging**: Leaflet keyboard navigation (arrow keys) provides alternatives to drag. Confirm it is working.

---

## 7. Issue Count Summary

### By Severity

| Severity | Count |
|---|---|
| Error (conformance failure) | **9 unique issues** |
| Warning (likely violation) | **5 categories** |
| Notice (manual check) | **23 criteria** |

### Errors by WCAG Principle

| Principle | Failures |
|---|---|
| **Principle 1 — Perceivable** | Color contrast (1), inline color (1), no landmark regions (informational) |
| **Principle 2 — Operable** | Keyboard inaccessible `onclick` divs (2 elements), no skip link (1) |
| **Principle 3 — Understandable** | None |
| **Principle 4 — Robust** | Unlabeled form controls (6 elements) |

### Errors by WCAG Level

| Level | Failures |
|---|---|
| Level A | 7 (unlabeled controls, keyboard, skip link) |
| Level AA | 2 (color contrast, reflow warning) |

### Conformance Status

| Standard | Status |
|---|---|
| WCAG 2.2 Level A | ❌ FAILS (7 Level A errors) |
| WCAG 2.2 Level AA | ❌ FAILS (7 Level A + 2 Level AA errors) |
| Section 508 | ❌ FAILS (incorporates WCAG 2.0 A/AA) |

---

## 8. Remediation Recommendations

Ordered by impact and effort (highest priority first):

### Priority 1 — Low Effort, High Impact

1. **Add `aria-label` to all `<input type="range">` sliders** (opacity sliders + timeline slider)
   - File: `templates/index.html`
   - Fixes: Errors 1, 3 (6 elements)
   - Effort: Minutes

2. **Add `for` attribute to speed selector `<label>`**
   - File: `templates/index.html`
   - Fixes: Error 4
   - Effort: Minutes

3. **Add `aria-label` to `#date-picker`**
   - File: `templates/index.html`
   - Fixes: Error 2
   - Effort: Minutes

4. **Associate `<label class="tl-speed-label">` with `#speed-select` via `for` attribute**
   - File: `templates/index.html`
   - Fixes: Error 4
   - Effort: Minutes

### Priority 2 — Medium Effort, High Impact

5. **Add skip navigation link**
   - Add `<a href="#main-content" class="skip-link">Skip to main content</a>` as first `<body>` child
   - Wrap interactive content in `<main id="main-content">`
   - Fixes: Error 5
   - Effort: 30 minutes

6. **Convert `#lm-header` and `#lm-basemap-header` to `<button>` elements**
   - Replace `<div onclick="">` with `<button type="button">` and add `aria-expanded`
   - Fixes: Error 7
   - Effort: 1–2 hours (requires JS update)

7. **Fix color contrast on Layer Manager title (`#lm-header > span`)**
   - Increase contrast of `.lm-title` text against panel background
   - Fixes: Error 6
   - Effort: 30 minutes

### Priority 3 — Medium Effort, Medium Impact

8. **Add ARIA landmark regions**
   - Wrap map in `<main>`, panels in `<aside>`, header in `<header>` with `role="banner"`
   - Addresses Warning W5 and improves overall navigation
   - Effort: 2–3 hours

9. **Add `role="status"` / `aria-live` to `#loading-badge`**
   - Ensures loading state changes are announced to screen reader users
   - Effort: 30 minutes

10. **Add `aria-label` to Leaflet map container**
    - `<div id="map" aria-label="Interactive air quality map" role="application">`
    - Effort: Minutes

### Priority 4 — Higher Effort / Library-Level

11. **Leaflet toolbar semantic markup** (Error 8)
    - Consider using a Leaflet accessibility plugin or overriding toolbar HTML
    - Third-party library constraint

12. **WCAG 2.2 manual testing**
    - Conduct screen reader testing (NVDA + Chrome, JAWS + Edge, VoiceOver + Safari)
    - Verify 2.4.11 focus appearance and 2.5.8 target size
    - Conduct keyboard-only walkthrough of all functionality

---

## 9. Raw pa11y Output

### Command Used

```bash
PUPPETEER_EXECUTABLE_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" \
pa11y \
  --standard WCAG2AA \
  --runner htmlcs \
  --runner axe \
  --include-notices \
  --include-warnings \
  --reporter json \
  --timeout 90000 \
  --wait 4000 \
  http://127.0.0.1:8123/ \
  > pa11y_aa_results.json
```

### Issue Counts from Raw Output

| Type | htmlcs | axe | Combined |
|---|---|---|---|
| Error | 7 | 8 | ~9 unique |
| Warning | 24 | 15 | ~29 total |
| Notice | 45 | 0 | 45 |
| **Total** | **76** | **23** | **~83** |

The raw JSON output is saved to `pa11y_aa_results.json` in the project root.

---

*Report generated by pa11y 9.1.1 automated testing against Django development server. Automated testing detects approximately 30–40% of WCAG failures; manual testing with assistive technology is required for full audit coverage.*
