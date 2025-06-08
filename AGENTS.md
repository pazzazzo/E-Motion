# Repository Guidelines

This repository contains the E-Motion project, an Electron dashboard.

## Coding conventions
- Use **4 spaces** for indentation in JavaScript files.
- End every file with a trailing newline.
- Avoid trailing whitespace.
- Semicolons are optional but follow existing style.

## Directory overview
- `src/` – main application code.
- `tests/` – Jest test suites.
- `jest.setup.js` – environment configuration for tests.
- `__mocks__/` – manual mocks for Jest.

## Testing instructions
- Run `npm test` to execute Jest.
- Always run tests after modifying JavaScript or configuration files.
- Ensure `web-audio-api` is installed so Jest has a real `AudioContext`.

## Dependency management
- Use `npm install --save <package>` for runtime deps.
- Use `npm install --save-dev <package>` for development deps.

## Commit guidelines
- Use short imperative messages (e.g. `Add helper`, `Fix bug`).
- Group related changes in a single commit when possible.

## Pull request guidelines
- Provide a concise **Summary** of the change.
- Include a **Testing** section describing the results of `npm test`.
- Note any limitations or follow up work in a **Notes** section if necessary.