# Branch Deploy Verification

## dev branch checklist
- [ ] Left-click navigation and product links respond without interference.
- [ ] POST /api/checkout with a valid `priceId` returns `{ url }` (no legacy payloads).
- [ ] Hydration completes without React 418 mismatch warnings on first load.
- [ ] Audio bed does not throw volume errors when toggled on.
- [ ] Radix Dialogs render without missing description warnings.

## uitest branch checklist
- [ ] Grimness slider and control panel appear when `NEXT_PUBLIC_GRIMNESS_ENABLED="1"`.
- [ ] Triple pressing `6` (or using the control) flips to void mode with Ant’s art swap.
- [ ] Featured sample card’s 3D tilt animates on desktop pointer devices only.
- [ ] Page transitions respect reduced-motion settings and stay under 450 ms.
