# Olimpia Type Scale — JSX Reference

All tokens are registered in `src/styles.css` via `@theme` as `--text-*` with paired `--text-*--line-height`. They generate Tailwind utilities (`text-display-xl`, etc.).

## Display

```tsx
{/* Hero — one per page */}
<h1 className="font-display text-display-xl text-foreground">
  More choices. <span className="italic text-raspberry">More freedom.</span>
</h1>

{/* Final CTA */}
<h2 className="font-display text-display-lg text-foreground">
  Ready when you are.
</h2>

{/* Section headline */}
<h2 className="font-display text-h1 md:text-display-md text-foreground">
  Built around <span className="italic text-raspberry">real life.</span>
</h2>
```

## Headings inside a section

```tsx
<h3 className="font-display text-h2 text-foreground">Card title</h3>
<h4 className="font-display text-h3 text-foreground">Small heading</h4>
```

## Body

```tsx
<p className="text-body-lg text-ink-muted">Lead paragraph under a section headline.</p>
<p className="text-body text-ink-muted">Default paragraph.</p>
<p className="text-body-sm text-ink-muted">Secondary helper text.</p>
<p className="text-caption text-ink-muted">Metadata, timestamps.</p>
```

## Eyebrow / label

```tsx
<p className="text-label font-semibold uppercase tracking-[0.18em] text-raspberry">
  Built around real life
</p>
```

## Buttons & nav (always Inter, body-sm)

```tsx
<button className="rounded-full bg-raspberry px-7 py-4 text-body-sm font-medium text-primary-foreground">
  Get early access
</button>

<nav className="flex gap-8 text-body-sm text-foreground/80">…</nav>
```

## Logo wordmark

```tsx
<a className="font-display text-h3 tracking-tight text-raspberry">Olimpia</a>
```

## Italic accent inside headings

Italic Cormorant is reserved for the "joy" word in a headline — never italicize whole sentences.

```tsx
<h2 className="font-display text-display-md text-foreground">
  Make money <span className="italic text-raspberry">feel simple.</span>
</h2>
```
