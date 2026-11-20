/**
 * A tiny in-memory message line between the corner shortcut and the popup, so the shortcut can ask for the popup to
 * open without the two components knowing about each other (and without any window event listeners).
 *
 * The popup (LoginPrompt) listens; the shortcut (LoginShortcut) asks. Nothing is stored and nothing runs until someone
 * asks, so this adds nothing to page load.
 */

type Listener = () => void

const listeners = new Set<Listener>()

/** Ask the popup to open now. Does nothing when no popup is listening (for example for a logged-in visitor). */
export function requestLoginPrompt(): void {
  listeners.forEach((listener) => listener())
}

/** The popup listens here. Returns the function that stops listening. */
export function onLoginPromptRequested(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
