/**
 * Utility to guarantee the browser paints DOM updates (such as loading spinners,
 * table items, and overlays) before continuing heavy synchronous tasks or closing loaders.
 */
export async function waitForDomRepaint(delayMs = 120): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, delayMs);
      });
    });
  });
}
