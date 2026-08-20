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
    const targetUsername = (creds && creds.username) ? creds.username.replace(/^@/, '').trim() : '';

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

    // Wait for initial page response
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create capture session tracking
    const captureSession = {
      caseId,
      platform,
      targetUsername,
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
    // If platform is Instagram, run the dedicated forensic pipeline
    if (platform === 'instagram') {
      await handleInstagramFlow(captureSession, sender);
    } else {
      const sections = platformConfig.sections || {};

      // Process each section
      for (const [sectionName, sectionConfig] of Object.entries(sections)) {
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
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (navError) {
            console.warn(`Could not navigate to ${sectionName} using nav_selector:`, navError.message);
          }
        }

        // Capture this section
        await captureSection(captureSession, sectionName, sectionConfig, sender);
      }
    }

    // Mark as completed
    captureSession.status = 'completed';
    captureSession.completedAt = new Date();

    sender.send('capture:log', {
      caseId,
      platform,
      text: `[SUCCESS] Evidence capture complete for ${platform.toUpperCase()}. Forensic session finished.`,
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
 * Dedicated Instagram Forensic Pipeline:
 * 1. Watches for & handles CAPTCHA / 2FA / Login resolution
 * 2. Navigates to Account Profile
 * 3. Extracts Followers, Following, and Posts/Activity Metrics
 * 4. Navigates to Direct Messages (Chats)
 * 5. Opens 1st Chat thread in inbox
 * 6. Continuous 3-second auto-scrolling screenshot capture
 */
async function handleInstagramFlow(captureSession, sender) {
  const { caseId, platform } = captureSession;
  const page = browserEngine.page;
  if (!page || page.isClosed()) return;

  // Step 1: Wait for Login & Check for CAPTCHA / 2FA
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[AUTH] Checking session & monitoring for CAPTCHA / 2FA challenges...',
    type: 'info'
  });

  const loggedIn = await waitForInstagramLoginOrCaptcha(page, sender, caseId);
  if (!loggedIn) {
    throw new Error('Authentication not completed or browser closed during verification.');
  }

  // Dismiss initial popup dialogs ("Save Info", "Turn on notifications")
  await dismissInstagramPopups(page, sender, caseId);

  // Step 2: Go to Account Profile
  let username = captureSession.targetUsername;
  if (!username) {
    try {
      const profileLink = page.locator('a[href^="/"][role="link"]:has(svg[aria-label*="Profile" i]), a[href^="/"]:has(img[alt*="profile" i])').first();
      if (await profileLink.isVisible({ timeout: 2500 })) {
        const href = await profileLink.getAttribute('href');
        if (href) username = href.replace(/\//g, '');
      }
    } catch (_) {}
  }

  sender.send('capture:log', {
    caseId,
    platform,
    text: `[NAV] Navigating to target Instagram Profile${username ? ` (@${username})` : ''}...`,
    type: 'info'
  });

  if (username) {
    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded' });
  } else {
    try {
      const profileBtn = page.locator('svg[aria-label*="Profile" i]').first();
      await profileBtn.click();
    } catch (_) {
      await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    }
  }

  await new Promise(r => setTimeout(r, 3500));
  await dismissInstagramPopups(page, sender, caseId);

  // Step 3: Extract Profile Metrics & Capture Profile Screenshot
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[PROFILE] Extracting follower/following counts, post stats & profile activity...',
    type: 'info'
  });

  let metrics = { posts: 'N/A', followers: 'N/A', following: 'N/A' };
  try {
    metrics = await page.evaluate(() => {
      const headerText = document.querySelector('header')?.innerText || document.body.innerText;
      const postsMatch = headerText.match(/([\d,\.KkMm]+)\s*(?:posts|post)/i);
      const followersMatch = headerText.match(/([\d,\.KkMm]+)\s*(?:followers|follower)/i);
      const followingMatch = headerText.match(/([\d,\.KkMm]+)\s*(?:following)/i);
      return {
        posts: postsMatch ? postsMatch[1] : 'N/A',
        followers: followersMatch ? followersMatch[1] : 'N/A',
        following: followingMatch ? followingMatch[1] : 'N/A'
      };
    });
  } catch (_) {}

  sender.send('capture:log', {
    caseId,
    platform,
    text: `[PROFILE METRICS] 📊 Posts: ${metrics.posts} | Followers: ${metrics.followers} | Following: ${metrics.following}`,
    type: 'success'
  });

  // Capture Profile Overview Screenshot
  await takeAndSaveScreenshot(captureSession, 'instagram_profile_overview', 1, sender);

  if (captureSession.stopRequested || page.isClosed()) return;

  // Step 4: Navigate to Direct Messages / Chats
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[NAV] Navigating to Instagram Direct Messages (Chats Inbox)...',
    type: 'info'
  });

  await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  await dismissInstagramPopups(page, sender, caseId);

  // Step 5: Locate and Click the 1st Chat in the inbox list
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CHATS] Locating first conversation thread in the inbox...',
    type: 'info'
  });

  const chatSelectors = [
    'div[role="list"] > div[role="button"]',
    'div[role="list"] a',
    'div.x1n2onr6 a[href*="/direct/t/"]',
    'div[aria-label="Chats"] div[role="button"]',
    'div[role="grid"] div[role="row"]',
    'div[role="button"]:has(img[alt*="profile" i])'
  ];

  let chatOpened = false;
  for (const cSel of chatSelectors) {
    try {
      const firstChat = page.locator(cSel).first();
      if (await firstChat.isVisible({ timeout: 2500 })) {
        await firstChat.click();
        chatOpened = true;
        sender.send('capture:log', {
          caseId,
          platform,
          text: '[CHATS] Opened 1st conversation thread. Loading chat message history...',
          type: 'success'
        });
        break;
      }
    } catch (_) {}
  }

  if (!chatOpened) {
    sender.send('capture:log', {
      caseId,
      platform,
      text: '[CHATS] Capturing active inbox viewport for chat messages...',
      type: 'info'
    });
  }

  await new Promise(r => setTimeout(r, 3000));

  // Step 6: Auto-scroll 1st Chat & Capture Screenshots every 3 seconds
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CAPTURE] Starting 3-second continuous scroll & screenshot capture for Chat Thread #1...',
    type: 'info'
  });

  let seq = 1;
  const maxChatSnapshots = 12; // 12 captures * 3s interval = 36s of continuous evidence capture

  for (let i = 0; i < maxChatSnapshots; i++) {
    if (captureSession.stopRequested || page.isClosed()) break;

    // Take screenshot
    await takeAndSaveScreenshot(captureSession, 'instagram_chat_thread_1', seq++, sender);

    // Wait 3 seconds
    await new Promise(r => setTimeout(r, 3000));
    if (captureSession.stopRequested || page.isClosed()) break;

    // Auto-scroll chat history up/down
    try {
      await page.evaluate(() => {
        const scrollable = Array.from(document.querySelectorAll('div')).find(
          el => el.scrollHeight > el.clientHeight && el.clientHeight > 200 && window.getComputedStyle(el).overflowY !== 'hidden'
        );
        if (scrollable) {
          scrollable.scrollTop = Math.max(0, scrollable.scrollTop - 450);
        } else {
          window.scrollBy(0, -350);
        }
      });
    } catch (_) {}
  }
}

/**
 * Dismiss common Instagram popups ("Not Now", "Save Info")
 */
async function dismissInstagramPopups(page, sender, caseId) {
  if (!page || page.isClosed()) return;
  const popupSelectors = [
    'button:has-text("Not Now")',
    'button:has-text("Not now")',
    'button:has-text("Cancel")',
    'button:has-text("Save info")',
    'button:has-text("Save Info")',
    'div[role="dialog"] button:has-text("Not Now")',
    'div[role="dialog"] button:has-text("Not now")',
    'button._a9--',
  ];

  for (const pSel of popupSelectors) {
    try {
      const btn = page.locator(pSel).first();
      if (await btn.isVisible({ timeout: 1200 })) {
        await btn.click();
        sender.send('capture:log', { caseId, platform: 'instagram', text: '[INFO] Dismissed modal prompt.', type: 'info' });
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (_) {}
  }
}

/**
 * Wait for Instagram login or notify user to solve CAPTCHA / 2FA
 */
async function waitForInstagramLoginOrCaptcha(page, sender, caseId) {
  if (!page || page.isClosed()) return false;

  let captchaNotified = false;
  const maxWaitMs = 180000; // 3 minutes wait time for CAPTCHA/2FA
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    if (page.isClosed()) return false;

    const url = page.url();

    // Check if successfully past login / challenge screens
    if (!url.includes('/accounts/login') && !url.includes('/challenge') && !url.includes('/checkpoint')) {
      sender.send('capture:log', {
        caseId,
        platform: 'instagram',
        text: '[AUTH] Login verified successfully! Proceeding with forensic capture.',
        type: 'success'
      });
      return true;
    }

    // Detect CAPTCHA or Security Checkpoint
    const hasCaptcha = await page.evaluate(() => {
      const text = document.body?.innerText || '';
      return (
        text.includes('Confirm that it’s you') ||
        text.includes('Help us confirm it') ||
        text.includes('Security Check') ||
        text.includes('Enter code') ||
        text.includes('two-factor') ||
        text.includes('robot') ||
        !!document.querySelector('iframe[src*="recaptcha"], iframe[src*="arkose"], iframe[src*="captcha"], #captcha')
      );
    });

    if (hasCaptcha && !captchaNotified) {
      captchaNotified = true;
      sender.send('capture:log', {
        caseId,
        platform: 'instagram',
        text: '[SECURITY] ⚠️ CAPTCHA / 2FA Challenge detected! Please complete the verification in the Chromium window. The capture suite will automatically resume once passed.',
        type: 'warn'
      });
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  return false;
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

  sender.send('capture:log', {
    caseId,
    platform,
    text: `[CAPTURE] Starting 3-second interval automated capture for ${sectionName.toUpperCase()}...`,
    type: 'info'
  });

  // Capture initial screenshot
  await takeAndSaveScreenshot(captureSession, sectionName, sequenceNumber++, sender);

  // If there's an expand_selector, try to click it to load more content
  if (sectionConfig.expand_selector) {
    try {
      await browserEngine.click(sectionConfig.expand_selector);
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3s wait
    } catch (expandError) {
      console.warn(`Could not expand ${sectionName}:`, expandError.message);
    }
  }

  // Continuous capture every 3 seconds while auto-scrolling
  const totalCapturesPerSection = 10;
  for (let i = 0; i < totalCapturesPerSection; i++) {
    if (captureSession.stopRequested || !browserEngine.browser || !browserEngine.page || browserEngine.page.isClosed()) {
      break;
    }

    // Wait exactly 3 seconds between screenshots
    await new Promise(resolve => setTimeout(resolve, 3000));
    if (captureSession.stopRequested || !browserEngine.page || browserEngine.page.isClosed()) break;

    // Scroll down to reveal new content/messages
    try {
      if (scrollTarget === 'window') {
        await browserEngine.page.evaluate(() => window.scrollBy(0, 600));
      } else {
        await browserEngine.page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (el) el.scrollTop += 600;
          else window.scrollBy(0, 600);
        }, scrollTarget);
      }
    } catch (_) {}

    // Take and save screenshot on every 3-second interval
    await takeAndSaveScreenshot(captureSession, sectionName, sequenceNumber++, sender);
  }

  // Final screenshot after scrolling completes
  if (!captureSession.stopRequested && browserEngine.page && !browserEngine.page.isClosed()) {
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
      timestamp: new Date().toISOString(),
      hash: metadata.sha256_hash
    });

    sender.send('capture:log', {
      caseId: captureSession.caseId,
      platform: captureSession.platform,
      text: `[CAPTURE] Snapshot #${sequenceNumber} captured (3s interval) | SHA-256: ${metadata.sha256_hash.substring(0, 16)}...`,
      type: 'success'
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