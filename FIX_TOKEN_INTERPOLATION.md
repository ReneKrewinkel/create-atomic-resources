# Fix: Token Font Size Class Name Interpolation

## Problem
When generating SCSS from design tokens, font sizes in `rem` units produce decimal values in class names (e.g., `.main-text-regular-9.6`). Decimal values are **not valid CSS identifiers** and cause SCSS compilation to fail.

## Root Cause
The `fontSizeClassToken()` function in `src/resources/styles/functions/_functions.scss` directly strips units from rem values without converting to a scale that avoids decimals.

For example:
- `0.6rem` → `strip-unit()` → `0.6` (invalid class name)
- `1.4rem` → `strip-unit()` → `1.4` (invalid class name)

## Solution
Modify `fontSizeClassToken()` to convert rem to pixel equivalents and multiply by 10 to maintain precision while producing valid identifiers:

```scss
@function fontSizeClassToken($size) {
  @if math.is-unitless($size) {
    @return $size;
  }

  @if math.unit($size) == 'rem' {
    $px: strip-unit($size) * 16;      // Convert rem to px (1rem = 16px)
    @return math.round($px * 10);      // Multiply by 10 to eliminate decimals
  }

  @return math.round(strip-unit($size) * 10);
}
```

## Result
- `0.6rem` → `96` → `.main-text-regular-96`
- `1rem` → `160` → `.main-text-regular-160`
- `1.4rem` → `224` → `.main-text-regular-224`
- `2.625rem` → `420` → `.main-text-regular-420`

All class names are now valid CSS identifiers. The multiplier (×10) is arbitrary but consistent—it could be ×100, ×1000, etc., as long as it's applied uniformly.

## File to Update
**`src/resources/styles/functions/_functions.scss`** — lines 12-22

This ensures the source token generation produces valid SCSS output without manual post-processing.
