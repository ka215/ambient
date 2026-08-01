# v2.6.3 Local Metadata Expansion Report

Date: 2026-08-01

## Scope

Expand local media metadata assist targets for ID3 tags.

## Implemented Mapping

Title:

- Primary: `TIT2`, `TT2`
- Fallback: `TIT3`, `TT3`
- Final fallback: media file basename without extension

Artist:

- `TPE1`, `TP1`
- `TPE2`, `TP2`
- `TPE3`, `TP3`
- `TPE4`, `TP4`
- `TOPE`, `TOA`

Description:

- Primary: `COMM`, `COM`
- Fallback: `TIT1`, `TT1`

## Validation

- `npm run typecheck`: Pass
- `npm run build`: Pass
- In-memory parser verification with generated ID3v2.2 and ID3v2.3 tags: Pass

## Notes

- The existing safe title auto-apply behavior is retained. Metadata title is applied only when the title field is empty or still contains the automatic filename fallback.
- Artist and description are suggested when available and remain unset when no supported metadata frame is present.
