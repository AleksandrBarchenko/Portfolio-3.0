/* Session-scoped navigation memory shared by the home page and the case studies.

   INTRO_SEEN_KEY — set once the orb greeting has played, so coming back to the
   home page (wordmark, "back to work", browser back) skips the scripted intro
   instead of replaying it every time.
   LAST_CASE_KEY — href of the case-study card last clicked, so returning lands
   the visitor on that card instead of the top of the list. */
export const INTRO_SEEN_KEY = "ab:intro-seen";
export const LAST_CASE_KEY = "ab:last-case";
/* Which layout the home "Works and Life" section shows — "list" (the original
   staggered cards) or "board" (the side-scrolling canvas). Persisted so a
   reload keeps the one being compared. */
export const WORKS_LAYOUT_KEY = "ab:works-layout";
