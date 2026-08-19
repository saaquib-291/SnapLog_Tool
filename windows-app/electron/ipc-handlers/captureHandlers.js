// Real capture IPC handlers that interact with the Playwright automation layer
const browserEngine = require('../../automation/core/browserEngine');
const scrollUtils = require('../../automation/core/scrollUtils');
const captureUtils = require('../../automation/core/captureUtils');
const sqlite = require('../db/sqlite');
const fs = require('fs').promises;
const path = require('path');

// Track active captures to enable status checks and stopping
const activeCaptures = new Map();

/**
 * Load platform configuration from JSON file
 * @param {string} platform - Platform name (e.g., 'instagram')
 * @returns {Object} Platform configuration
 */
async function loadPlatformConfig(platform) {
  try {
    const configPath = path.join(__dirname, '../../automation/platforms/configs', `${platform}.json`);
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    throw new Error(`Failed to load platform config for ${platform}: ${error.message}`);
  }
}

/**
 * Handle start capture request
 * @param {Event} event - IPC event
 * @param {Object} data - { caseId, platform }
 */
async function handleStart(event, data) {
  const { caseId, platform } = data;
  const sender = event.sender;

  // Check if already capturing this case/platform
  const captureKey = `${caseId}-${platform}`;
  if (activeCaptures.has(captureKey)) {
    // Check if previous browser instance is actually dead
    if (!browserEngine.browser || !browserEngine.page || browserEngine.page.isClosed()) {
      activeCaptures.delete(captureKey);
    } else {
      return {
        success: false,
        error: `Capture already in progress for case ${caseId} on platform ${platform}`
      };
    }
  }

  try {
    // Load platform configuration
    const platformConfig = await loadPlatformConfig(platform);

    sender.send('capture:log', {
      caseId,
      platform,
      text: `[INIT] Launching persistent headed Chromium session for ${platform.toUpperCase()}...`,
      type: 'info'
    });

    // Initialize browser if not already done
    await browserEngine.launch({ headless: false });

    // Setup browser / page close detection
    const handleBrowserClosed = () => {
      if (activeCaptures.has(captureKey)) {
        console.log(`[CAPTURE] Browser window closed for ${captureKey}`);
        activeCaptures.delete(captureKey);
        try {
          sender.send('capture:log', {
            caseId,
            platform,
            text: '[BROWSER] Website window was closed. Forensic capture progress is OVER.',
            type: 'warn'
          });
          sender.send('capture:browserClosed', {
            caseId,
            platform,
            message: 'Website window was closed. Progress is over.'
          });
        } catch (_) {}
      }
    };

    if (browserEngine.page) {
      browserEngine.page.once('close', handleBrowserClosed);
    }
    if (browserEngine.browser) {
      browserEngine.browser.once('disconnected', handleBrowserClosed);
    }

    sender.send('capture:log', {
      caseId,
      platform,
      text: `[NAV] Navigating to login URL: ${platformConfig.login_url}`,
      type: 'info'
    });

    // Navigate to login URL
    await browserEngine.navigate(platformConfig.login_url);

    // Retrieve credentials strictly from in-memory payload (never stored in DB)
    let creds = data.credentials;

    // Auto-fill login credentials if provided in memory
    if (creds && creds.username) {
      await autoFillPlatformLogin(platform, creds, sender, caseId);
      // Immediately clear in-memory credential reference for privacy & security
      creds = null;
    } else {
      sender.send('capture:log', {
        caseId,
        platform,
        text: '[AUTH] No credentials provided. Please log in manually in the Chromium window.',
        type: 'info'
      });
    }

    // Wait for authentication and session readiness (including OTP/2FA if needed)
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Create capture session tracking
    const captureSession = {
      caseId,
      platform,
      platformConfig,
      startedAt: new Date(),
      status: 'in_progress',
      screenshotsCaptured: 0,
      totalExpected: 0,
      currentSection: null,
      stopRequested: false
    };

    activeCaptures.set(captureKey, captureSession);

    // Start capturing sections in background
    captureSections(captureSession, sender).catch(error => {
      console.error(`Capture error for ${captureKey}:`, error);
      captureSession.status = 'failed';
      captureSession.error = error.message;
      activeCaptures.delete(captureKey);
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[ERROR] Capture error: ${error.message}`,
        type: 'error'
      });
    });

    return {
      success: true,
      caseId,
      platform,
      startedAt: captureSession.startedAt.toISOString(),
      message: `Capture started for ${platform} in case ${caseId}`
    };
  } catch (error) {
    console.error(`Failed to start capture for ${caseId} on ${platform}:`, error);
    activeCaptures.delete(captureKey);
    sender.send('capture:log', {
      caseId,
      platform,
      text: `[ERROR] Failed to start capture: ${error.message}`,
      type: 'error'
    });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Capture all sections for a platform
 * @param {Object} captureSession - The capture session object
 * @param {Object} sender - IPC sender for progress updates
 */
async function captureSections(captureSession, sender) {
  const { caseId, platform, platformConfig } = captureSession;
  const captureKey = `${caseId}-${platform}`;

  try {
    const sections = platformConfig.sections || {};

    // Process each section
    for (const [sectionName, sectionConfig] of Object.entries(sections)) {
      // Check if stop was requested or browser was closed
      if (captureSession.stopRequested || !browserEngine.browser || !browserEngine.page || browserEngine.page.isClosed()) {
        break;
      }

      captureSession.currentSection = sectionName;
      captureSession.status = `capturing_${sectionName}`;

      sender.send('capture:log', {
        caseId,
        platform,
        text: `[NAV] Navigating to section: ${sectionName.toUpperCase()}`,
        type: 'info'
      });

      // Navigate to section if nav_selector exists
      if (sectionConfig.nav_selector) {
        try {
          await browserEngine.click(sectionConfig.nav_selector);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for navigation
        } catch (navError) {
          console.warn(`Could not navigate to ${sectionName} using nav_selector:`, navError.message);
        }
      }

      // Capture this section
      await captureSection(captureSession, sectionName, sectionConfig, sender);
    }

    // Mark as completed
    captureSession.status = 'completed';
    captureSession.completedAt = new Date();

    sender.send('capture:log', {
      caseId,
      platform,
      text: `[SUCCESS] Evidence capture complete for ${platform.toUpperCase()}. Progress is over.`,
      type: 'success'
    });

    // Send completion notification
    sender.send('capture:completed', {
      caseId,
      platform,
      screenshotsCaptured: captureSession.screenshotsCaptured,
      completedAt: captureSession.completedAt.toISOString()
    });

    // Clean up browser & session
    await browserEngine.close();
    activeCaptures.delete(captureKey);
  } catch (error) {
    captureSession.status = 'failed';
    captureSession.error = error.message;
    activeCaptures.delete(captureKey);
    sender.send('capture:error', {
      caseId,
      platform,
      error: error.message
    });
    sender.send('capture:log', {
      caseId,
      platform,
      text: `[ERROR] ${error.message}. Progress concluded.`,
      type: 'error'
    });
    try {
      await browserEngine.close();
    } catch (_) {}
    throw error;
  }
}

/**
 * Capture a single section with scrolling
 * @param {Object} captureSession - The capture session object
 * @param {string} sectionName - Name of the section (e.g., 'followers')
 * @param {Object} sectionConfig - Configuration for this section
 * @param {Object} sender - IPC sender for progress updates
 */
async function captureSection(captureSession, sectionName, sectionConfig, sender) {
  const { caseId, platform } = captureSession;

  // Determine scroll target
  const scrollTarget = sectionConfig.scroll_target || 'window';

  // Reset sequence number for this section
  let sequenceNumber = 1;

  // Capture initial screenshot
  await takeAndSaveScreenshot(captureSession, sectionName, sequenceNumber++, sender);

  // If there's an expand_selector, try to click it to load more content
  if (sectionConfig.expand_selector) {
    try {
      await browserEngine.click(sectionConfig.expand_selector);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for expansion
    } catch (expandError) {
      console.warn(`Could not expand ${sectionName}:`, expandError.message);
    }
  }

  // Auto-scroll to capture all content
  let scrollStable = false;
  let scrollAttempts = 0;
  const maxScrollAttempts = 20;

  while (!scrollStable && scrollAttempts < maxScrollAttempts && !captureSession.stopRequested) {
    scrollAttempts++;

    // Scroll and wait for content to load
    await scrollUtils.autoScrollUntilStable({
      page: browserEngine.page,
      scrollTarget: scrollTarget === 'window' ? 'window' : sectionConfig.list_container_selector || scrollTarget,
      maxAttempts: 3,
      delay: 1500,
      onProgress: ({ attempt, heightChanged }) => {
        if (heightChanged) {
          // New content loaded, take a screenshot
          takeAndSaveScreenshot(captureSession, sectionName, sequenceNumber++, sender);
        }
      }
    });

    // Check if we've reached the bottom or no more content
    // In a real implementation, we might check for specific end-of-content markers
    scrollStable = scrollAttempts >= maxScrollAttempts;
  }

  // Final screenshot after scrolling completes
  if (!captureSession.stopRequested) {
    await takeAndSaveScreenshot(captureSession, sectionName, sequenceNumber++, sender);
  }
}

/**
 * Take a screenshot and save it with metadata
 * @param {Object} captureSession - The capture session object
 * @param {string} sectionName - Name of the section
 * @param {number} sequenceNumber - Sequence number for this screenshot
 * @param {Object} sender - IPC sender for progress updates
 */
async function takeAndSaveScreenshot(captureSession, sectionName, sequenceNumber, sender) {
  // Check if stop was requested
  if (captureSession.stopRequested) return;

  try {
    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15); // YYYYMMDDTHHMMSS format

    // Take screenshot
    const screenshotBuffer = await browserEngine.screenshot({
      fullPage: true
    });

    // Save screenshot and generate metadata
    const { filePath, metadata } = await captureUtils.saveScreenshot({
      buffer: screenshotBuffer,
      platform: captureSession.platform,
      section: sectionName,
      sequenceNumber: sequenceNumber,
      timestamp: timestamp,
      baseDir: path.join(__dirname, '../../data/captures'),
      caseId: captureSession.caseId,
      examinerId: 'examiner001', // In real app, this would come from auth service
    });

    // Save evidence artifact to SQLite database (forensic.db)
    sqlite.saveArtifact({
      id: metadata.screenshot_id,
      caseId: captureSession.caseId,
      platform: captureSession.platform,
      section: sectionName,
      sequenceNumber: sequenceNumber,
      filePath: filePath,
      hash: metadata.sha256_hash,
      sourceUrlOrScreen: metadata.source_url_or_screen,
      timestamp: metadata.timestamp
    });

    // Update capture session
    captureSession.screenshotsCaptured++;

    // Send progress update
    sender.send('capture:progress', {
      caseId: captureSession.caseId,
      platform: captureSession.platform,
      section: sectionName,
      screenshotNumber: sequenceNumber,
      filePath: filePath,
      timestamp: new Date().toISOString()
    });

    console.log(`Saved screenshot ${sequenceNumber} for ${captureSession.caseId}/${sectionName}: ${filePath}`);
  } catch (error) {
    console.error(`Failed to take/save screenshot for ${sectionName}:`, error);
    // Don't throw here - we want to continue capturing other sections
  }
}

/**
 * Handle get capture status request
 * @param {Event} event - IPC event
 * @param {Object} data - { caseId, platform }
 */
async function handleGetStatus(event, data) {
  const { caseId, platform } = data;
  const captureKey = `${caseId}-${platform}`;

  const captureSession = activeCaptures.get(captureKey);

  if (!captureSession) {
    return {
      success: false,
      error: `No active capture found for case ${caseId} on platform ${platform}`
    };
  }

  return {
    success: true,
    caseId,
    platform,
    status: captureSession.status,
    progress: captureSession.status === 'completed' ? 100 :
              captureSession.status === 'failed' ? 0 :
              Math.min(95, Math.floor((captureSession.screenshotsCaptured / (captureSession.screenshotsCaptured + 10)) * 100)), // Estimated progress
    screenshotsCaptured: captureSession.screenshotsCaptured,
    totalExpected: captureSession.totalExpected || 0,
    currentSection: captureSession.currentSection,
    startedAt: captureSession.startedAt?.toISOString(),
    updatedAt: new Date().toISOString(),
    error: captureSession.error || null
  };
}

/**
 * Handle stop capture request
 * @param {Event} event - IPC event
 * @param {Object} data - { caseId, platform }
 */
async function handleStop(event, data) {
  const { caseId, platform } = data;
  const captureKey = `${caseId}-${platform}`;

  const captureSession = activeCaptures.get(captureKey);

  if (!captureSession) {
    return {
      success: false,
      error: `No active capture found to stop for case ${caseId} on platform ${platform}`
    };
  }

  try {
    // Signal stop
    captureSession.stopRequested = true;
    captureSession.status = 'stopping';

    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up browser resources if this was the last capture
    const remainingCaptures = Array.from(activeCaptures.keys()).filter(key =>
      !key.startsWith(`${caseId}-`) || key === captureKey
    );

    if (remainingCaptures.length === 0) {
      await browserEngine.close();
    }

    // Remove from active captures
    activeCaptures.delete(captureKey);

    return {
      success: true,
      caseId,
      platform,
      stoppedAt: new Date().toISOString(),
      message: `Capture stopped for ${platform} in case ${caseId}`,
      screenshotsCaptured: captureSession.screenshotsCaptured
    };
  } catch (error) {
    console.error(`Error stopping capture for ${captureKey}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Auto-fill platform credentials with cookie handling and robust multi-selector fallback
 */
async function autoFillPlatformLogin(platform, creds, sender, caseId) {
  if (!browserEngine.page || !creds || !creds.username) return;

  const page = browserEngine.page;
  sender.send('capture:log', {
    caseId,
    platform,
    text: `[AUTH] Auto-login active: Searching for login fields for user "${creds.username}"...`,
    type: 'info'
  });

  try {
    // 1. Check and dismiss any Cookie / Privacy Dialogs
    const cookieSelectors = [
      'button:has-text("Allow all cookies")',
      'button:has-text("Allow essential and optional cookies")',
      'button:has-text("Decline optional cookies")',
      'button:has-text("Only allow essential cookies")',
      'button:has-text("Accept All")',
      'button:has-text("Accept")',
      'button[data-cookiebanner="accept_button"]',
      'button._a9--',
    ];

    for (const cSel of cookieSelectors) {
      try {
        const cookieBtn = page.locator(cSel).first();
        if (await cookieBtn.isVisible({ timeout: 1500 })) {
          await cookieBtn.click();
          sender.send('capture:log', { caseId, platform, text: '[AUTH] Dismissed cookie dialog.', type: 'info' });
          await new Promise(r => setTimeout(r, 1000));
          break;
        }
      } catch (_) {}
    }

    // 2. Identify Username Field
    const usernameSelectors = [
      "input[name='username']",
      "input[name='email']",
      "input#email",
      "input[autocomplete='username']",
      "input[name='text']",
      "input[aria-label*='username' i]",
      "input[aria-label*='email' i]",
      "input[aria-label*='Phone' i]",
      "input[type='email']",
      "input[type='text']"
    ];

    let userFieldFound = false;
    for (const uSel of usernameSelectors) {
      try {
        const el = page.locator(uSel).first();
        if (await el.isVisible({ timeout: 2500 })) {
          await el.click();
          await new Promise(r => setTimeout(r, 200));
          await el.fill('');
          await el.pressSequentially(creds.username, { delay: 40 });
          userFieldFound = true;
          sender.send('capture:log', { caseId, platform, text: `[AUTH] Entered username "${creds.username}".`, type: 'info' });
          break;
        }
      } catch (_) {}
    }

    if (!userFieldFound) {
      sender.send('capture:log', { caseId, platform, text: `[AUTH] Could not locate username input field automatically. Please enter credentials in the browser.`, type: 'warn' });
      return;
    }

    await new Promise(r => setTimeout(r, 600));

    // 3. For Twitter / X: handle 2-step username -> Next -> password
    if (platform === 'twitter') {
      try {
        const nextBtn = page.locator('button:has-text("Next"), div[role="button"]:has-text("Next")').first();
        if (await nextBtn.isVisible({ timeout: 2000 })) {
          await nextBtn.click();
          sender.send('capture:log', { caseId, platform, text: `[AUTH] Clicked "Next" button for Twitter.`, type: 'info' });
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (_) {}
    }

    // 4. Identify Password Field
    if (creds.password) {
      const passwordSelectors = [
        "input[name='password']",
        "input[name='pass']",
        "input#pass",
        "input[type='password']",
        "input[aria-label*='password' i]"
      ];

      for (const pSel of passwordSelectors) {
        try {
          const pEl = page.locator(pSel).first();
          if (await pEl.isVisible({ timeout: 3000 })) {
            await pEl.click();
            await new Promise(r => setTimeout(r, 200));
            await pEl.fill('');
            await pEl.pressSequentially(creds.password, { delay: 40 });
            sender.send('capture:log', { caseId, platform, text: `[AUTH] Entered password into secure field.`, type: 'info' });
            break;
          }
        } catch (_) {}
      }
    }

    await new Promise(r => setTimeout(r, 600));

    // 5. Submit Login Form
    const submitSelectors = [
      "button[type='submit']",
      "button[name='login']",
      "button:has-text('Log In')",
      "button:has-text('Log in')",
      "button:has-text('Sign In')",
      "div[role='button']:has-text('Log in')",
      "form button"
    ];

    for (const sSel of submitSelectors) {
      try {
        const sEl = page.locator(sSel).first();
        if (await sEl.isVisible({ timeout: 2000 })) {
          await sEl.click();
          sender.send('capture:log', { caseId, platform, text: `[AUTH] Clicked Log In button. Awaiting authentication / OTP...`, type: 'success' });
          break;
        }
      } catch (_) {}
    }
  } catch (err) {
    sender.send('capture:log', { caseId, platform, text: `[AUTH] Auto-fill note: ${err.message}`, type: 'warn' });
  }
}

module.exports = {
  handleStart,
  handleGetStatus,
  handleStop
};