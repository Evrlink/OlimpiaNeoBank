# Pre-finish Typography Audit

Run before claiming a UI edit is done.

## 1. Grep for arbitrary values

```bash
rg -n "text-\[" src/
rg -n "leading-\[" src/
rg -n "tracking-\[(?!0\.18em)" src/   # 0.18em is the approved label tracking
rg -n "font-family" src/
rg -n '"Cormorant|"Inter' src/        # raw font names should only appear in styles.css
```

Any match outside `src/styles.css` is a violation — replace with a scale token.

## 2. Confirm Cormorant scope

```bash
rg -n "font-display" src/
```

For each hit, verify the size is `text-h3` or larger. `font-display` on body, button, nav, label, or caption text is forbidden.

## 3. Confirm weight discipline

`font-display` lines may carry no weight class (defaults to 400) or `font-medium` (500). Reject `font-semibold`, `font-bold`, `font-black` paired with `font-display`.

## 4. Headline hierarchy

Within one section: section headline > card headline > body. Never let a card title equal or exceed the section title's size token.

## 5. One hero per page

`text-display-xl` should appear exactly once per route — on the hero `<h1>`.
