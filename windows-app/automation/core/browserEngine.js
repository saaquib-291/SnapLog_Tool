// browserEngine.js - Manages Playwright browser instance and provides navigation and interaction functions

const { chromium } = require('playwright');

class BrowserEngine {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  // Launch the browser and create a new context and page
  async launch(options = {}) {
    this.browser = await chromium.launch({
      headless: false, // We want to see the browser for manual login
      ...options
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    return this.page;
  }

  // Navigate to a URL
  async navigate(url) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  // Click an element by selector
  async click(selector) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.page.click(selector);
  }

  // Fill an input field by selector
  async fill(selector, value) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.page.fill(selector, value);
  }

  // Get the page content (for debugging)
  async content() {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.page.content();
  }

  // Take a screenshot and save it to a file
  async screenshot(options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.page.screenshot(options);
  }

  // Close the browser and clean up
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}

module.exports = new BrowserEngine(); // Export a singleton instance