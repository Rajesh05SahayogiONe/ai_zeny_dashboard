/**
 * Opens `href` in its own browser window covering the whole screen (a POS
 * terminal, say), named so a second call brings that window forward instead
 * of opening another. Browsers only allow this from a click; if a pop-up
 * blocker still refuses, the page opens in the current tab instead, so the
 * click is never a dead end.
 *
 * Deliberately not `noopener`: the opened page uses `window.opener` to know
 * it may close itself (window.close() only works on script-opened windows).
 */
export function openFullScreenWindow(href: string, name: string): void {
  const { availWidth, availHeight } = window.screen;
  // availLeft/availTop place it on the screen the browser is on; not in every engine's typings.
  const { availLeft = 0, availTop = 0 } = window.screen as Screen & { availLeft?: number; availTop?: number };
  const features = `popup=yes,left=${availLeft},top=${availTop},width=${availWidth},height=${availHeight}`;
  const opened = window.open(href, name, features);
  if (opened) opened.focus();
  else window.location.assign(href);
}
