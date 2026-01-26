# Testing

## Running Tests

```bash
# Run all tests once
npm test -- run

# Run tests in watch mode (re-runs on file changes)
npm test

# Run a specific test file
npm test -- run src/__tests__/levels.test.ts
```

## Test Files

- `src/__tests__/levels.test.ts` - Level validation tests
- `src/__tests__/conditions.test.ts` - Condition evaluation tests
- `src/__tests__/engine.test.ts` - Game engine execution tests

## Level Elements Reference

| Code   | Element                       |
| ------ | ----------------------------- |
| `0`    | void                          |
| `1`    | vertical lane                 |
| `2`    | corner up-right               |
| `3`    | corner right-down             |
| `4`    | corner down-left              |
| `5`    | corner left-up                |
| `6`    | horizontal lane               |
| `+`    | cross lane                    |
| `7`    | start                         |
| `8`    | data                          |
| `9`    | empty data (target)           |
| `A..Z` | teleports (chain: A→B→C→D...) |
