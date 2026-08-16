// scrollUtils.js - Implements auto-scroll logic with height stabilization detection

/**
 * Scrolls a container or window until no new content is loaded (height stabilizes)
 * @param {Object} options - Configuration options
 * @param {Page} options.page - Playwright page object
 * @param {string|ElementHandle} options.scrollTarget - Selector for the element to scroll, or 'window'
 * @param {number} options.maxAttempts - Maximum number of scroll attempts (default: 50)
 * @param {number} options.delay - Delay between scroll attempts in ms (default: 1000)
 * @param {Function} options.onProgress - Callback function called after each scroll attempt with {attempt, heightChanged}
 * @returns {Promise<void>}
 */
async function autoScrollUntilStable({ page, scrollTarget, maxAttempts = 50, delay = 1000, onProgress }) {
  if (!page) {
    throw new Error('Page object is required');
  }

  let lastHeight = 0;
  let attempts = 0;
  let heightChanged = true;

  while (attempts < maxAttempts && heightChanged) {
    // Get the current height of the scroll target
    let currentHeight;
    if (scrollTarget === 'window') {
      currentHeight = await page.evaluate('document.body.scrollHeight');
    } else {
      currentHeight = await page.evaluate(`(selector) => {
        const element = document.querySelector(selector);
        return element ? element.scrollHeight : 0;
      }`, scrollTarget);
    }

    // Scroll to the bottom
    if (scrollTarget === 'window') {
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    } else {
      await page.evaluate(`(selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollTo(0, element.scrollHeight);
        }
      }`, scrollTarget);
    }

    // Wait for content to load
    await page.waitForTimeout(delay);

    // Get the new height
    let newHeight;
    if (scrollTarget === 'window') {
      newHeight = await page.evaluate('document.body.scrollHeight');
    } else {
      newHeight = await page.evaluate(`(selector) => {
        const element = document.querySelector(selector);
        return element ? element.scrollHeight : 0;
      }`, scrollTarget);
    }

    heightChanged = newHeight !== lastHeight;
    lastHeight = newHeight;
    attempts++;

    // Call progress callback if provided
    if (onProgress) {
      onProgress({ attempt: attempts, heightChanged });
    }
  }

  return;
}

module.exports = { autoScrollUntilStable };