# Peptides E-Commerce — Project Documentation

> Complete documentation set for building a bilingual (EN/ES) peptides e-commerce store on Next.js 15 + Payload CMS 3, targeting the USA market.

---

## How to use this documentation

This `/docs` folder is your **project bible**. Drop it into the root of your project and your AI IDE will read these files for context. This is the single most important habit for AI-assisted development: **without context, the AI guesses; with context, it executes.**

### Setup for your AI IDE

**Claude Code:** Already reads `CLAUDE.md` at project root automatically. Copy `CLAUDE.md` to your project root.

**Cursor:** Rename `CLAUDE.md` to `.cursorrules` and place at root, OR keep both — Cursor reads `.cursorrules` first.

**Windsurf:** Copy `CLAUDE.md` content into `.windsurfrules` at root.

**Any IDE:** At the start of every new chat/session, paste this line:

> "Read /docs/PROJECT-CONTEXT.md, /docs/SCHEMAS.md, and /docs/FEATURES.md before doing anything. We are in phase [X] of /docs/BUILD-GUIDE.md."

---

## File index

| File                  | Purpose                                   | When to read              |
| --------------------- | ----------------------------------------- | ------------------------- |
| `README.md`           | This file. Navigation.                    | First                     |
| `CLAUDE.md`           | Rules the AI must follow on this project  | Auto-loaded by AI         |
| `PROJECT-CONTEXT.md`  | Project overview, tech stack, conventions | Every AI session          |
| `LEGAL-USA.md`        | Peptides legal/compliance for USA market  | Before payments + content |
| `SCHEMAS.md`          | All Payload collections (data models)     | When building schemas     |
| `FEATURES.md`         | Every feature with user stories           | When building features    |
| `BUILD-GUIDE.md`      | Phase-by-phase step-by-step build         | Your roadmap              |
| `PROMPTS.md`          | Copy-paste prompts library, in order      | Daily use                 |
| `ENV-VARIABLES.md`    | All environment variables                 | When deploying            |
| `LAUNCH-CHECKLIST.md` | Pre-launch verification                   | Before going live         |

---

## The build order (high level)

1. **Phase 0:** Business + legal setup (no code)
2. **Phase 1:** Local environment + accounts
3. **Phase 2:** Project initialization (Payload ecommerce template)
4. **Phase 3:** Database schemas (all collections)
5. **Phase 4:** Authentication (customers + admins)
6. **Phase 5:** Bilingual setup (EN/ES)
7. **Phase 6:** Product catalog (admin + frontend)
8. **Phase 7:** Cart functionality
9. **Phase 8:** Wishlist
10. **Phase 9:** Checkout + payment (Stripe)
11. **Phase 10:** Orders + order management
12. **Phase 11:** Coupons + discounts
13. **Phase 12:** Shipping + tracking
14. **Phase 13:** Customer dashboard
15. **Phase 14:** Email notifications (Resend)
16. **Phase 15:** Reviews + ratings
17. **Phase 16:** Search (Meilisearch)
18. **Phase 17:** Blog + content pages
19. **Phase 18:** Analytics + monitoring
20. **Phase 19:** SEO + performance
21. **Phase 20:** Security + launch prep

Total realistic timeline for a beginner with AI assistance: **3–4 months part-time.**

---

## Golden rules

1. **Never skip a phase.** Each builds on the last.
2. **Commit after every working feature.** Git is your safety net.
3. **Test payments with test cards.** Never use real cards in development.
4. **Read errors before pasting to AI.** Half the time the error tells you exactly what's wrong.
5. **One feature per branch.** `git checkout -b feature/wishlist`, merge when done.
6. **Verify AI's work.** AI is fast at writing, bad at being right about money, security, and edge cases.
