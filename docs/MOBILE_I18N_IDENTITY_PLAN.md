# Mobile, localization and player identity — implementation plan

## Product decisions

- The public site remains Russian-first. English is a complete second locale, not a browser-translation overlay.
- The public navigation uses **Экосистема** as the single entry point for the server's systems. Classes remain a subsystem and keep their existing URLs and detail pages.
- The approved homepage composition and its citadel artwork are protected from this work.
- Mobile layouts must preserve every action and every content item. Controls may reflow, stack or become scrollable; they must not silently disappear.
- The static GitHub Pages frontend must never contain authentication secrets, signing keys, payment credentials or privileged API tokens.

## Mobile acceptance criteria

1. Audit every public HTML route at 320, 360, 390, 430, 768 and desktop widths.
2. No horizontal page overflow; intentionally scrollable components (for example the case reel) remain locally scrollable.
3. Navigation remains complete and keyboard-operable. Any future drawer must expose aria-expanded, close on Escape and link activation, restore focus to its trigger and lock background scrolling only while open.
4. Dialogs preserve focus management, close controls and touch targets; forms retain labels, validation and visible feedback.
5. Shop, case roulette, account demo, support prototype, map links and all existing effects remain usable. Reduced-motion preferences are respected.
6. Touch devices do not depend on hover or custom cursor behavior.
7. Smoke tests check all local links, duplicate IDs, JS syntax, CSS braces and required interaction hooks. A real-device visual pass remains a separate release gate.

## RU/EN localization architecture

Use a shared dictionary runtime rather than translating only the header.

- assets/i18n/ru.json and assets/i18n/en.json hold equivalent keys.
- Mark visible text with data-i18n; use data-i18n-attr for attributes such as placeholder, aria-label, title and document metadata.
- Keep semantic HTML and existing IDs stable. Do not replace whole page bodies with opaque HTML strings.
- The switcher updates document.documentElement.lang, visible strings and translated metadata together.
- Persist the explicit user choice; use Russian as the initial default. Do not silently force a browser-language redirect.
- Every page must declare translation coverage. Do not expose an English switcher on a page until all meaningful visible text, dialogs, validation messages, metadata and accessibility labels have English entries.
- Preserve number/date formatting through Intl with the selected locale.
- The default Russian page must remain readable if the dictionary fails to load.

## Player identity and future forum

### Trust model

A website account is not proof of ownership of a Minecraft account. The canonical identity is the immutable Minecraft UUID verified by the game server.

1. The player requests a short-lived one-time link challenge from the Identity API.
2. The player executes /link <code> in-game.
3. The Paper plugin validates the challenge with the Identity API over authenticated server-to-server transport and binds the UUID.
4. The website exchanges the completed challenge for a server-managed session.
5. The browser receives only a Secure, HttpOnly, SameSite session cookie. No bearer token is placed in localStorage or exposed to page JavaScript.

### Required API responsibilities

- Challenge creation, expiry, attempt limits and one-time consumption.
- UUID binding, account unlinking and session revocation.
- Session rotation, CSRF protection, origin allowlisting, rate limiting and audit events.
- Server-side authorization on every forum write and every wallet operation.
- Read-only guest access can be public. Creating topics, replying, editing and wallet actions require a linked, authenticated game identity.
- Wallet operations use an authoritative server-side ledger with idempotency keys and immutable audit history. The browser never decides a balance or final transaction result.

### Non-goals for the static website

GitHub Pages cannot securely implement this identity service. The frontend can later consume the API, but production login, forum writes and balance operations remain disabled until the Identity API, Paper integration, database, HTTPS origin and operational controls are deployed and tested.

## Rollout sequence

1. Shared responsive behavior and navigation audit.
2. Translation inventory and complete RU/EN dictionary coverage, page by page.
3. Identity API contract and Paper /link integration in a separate backend/plugin project.
4. Website session integration after the backend passes security review.
5. Forum and wallet permissions only after server-side authorization and ledger tests pass.

## Current implementation slice

The first website slice renames the systems entry point to **Экосистема**, removes the duplicate top-level class link from shared portal navigation while retaining the class catalogue, and improves touch/focus behavior for the shared world pages. This is not a claim that full-site mobile QA, RU/EN translation or production authentication is complete.
