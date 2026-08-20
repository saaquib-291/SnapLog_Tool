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
    const targetChatUser = (creds && creds.targetChatUser) ? creds.targetChatUser.replace(/^@/, '').trim() : '';

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
      targetChatUser,
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
    switch (platform.toLowerCase()) {
      case 'instagram':
        await handleInstagramFlow(captureSession, sender);
        break;
      case 'facebook':
        await handleFacebookFlow(captureSession, sender);
        break;
      case 'twitter':
      case 'x':
        await handleTwitterFlow(captureSession, sender);
        break;
      case 'whatsapp':
        await handleWhatsAppFlow(captureSession, sender);
        break;
      case 'telegram':
        await handleTelegramFlow(captureSession, sender);
        break;
      case 'google':
      case 'gmail':
        await handleGoogleFlow(captureSession, sender);
        break;
      default:
        await handleGenericPlatformFlow(captureSession, sender);
        break;
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

    sender.send('capture:log', {
      caseId,
      platform,
      text: `[INFO] Browser window remains open for examiner review. Click 'Stop Capture' or close the window when finished.`,
      type: 'info'
    });

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
    throw error;
  }
}

/**
 * 1. INSTAGRAM FORENSIC PIPELINE
 */
async function handleInstagramFlow(captureSession, sender) {
  const { caseId, platform } = captureSession;
  const page = browserEngine.page;
  if (!page || page.isClosed()) return;

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[AUTH] Checking session & monitoring for CAPTCHA / 2FA challenges on Instagram...',
    type: 'info'
  });

  const loggedIn = await waitForPlatformLoginOrCaptcha(page, 'instagram', sender, caseId);
  if (!loggedIn) throw new Error('Instagram authentication not completed.');

  await dismissInstagramPopups(page, sender, caseId);

  // Profile Navigation & Metrics
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

  // Extract Profile Metrics
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

  await takeAndSaveScreenshot(captureSession, 'instagram_profile_overview', 1, sender);
  if (captureSession.stopRequested || page.isClosed()) return;

  // Direct Messages & 1st Chat Auto-Scroll
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[NAV] Navigating to Instagram Direct Messages (Chats Inbox)...',
    type: 'info'
  });

  await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  await dismissInstagramPopups(page, sender, caseId);

  // 1. Dismiss any open note or modal prompt if visible
  await dismissInstagramPopups(page, sender, caseId);

  const targetChat = (captureSession.targetChatUser || '').trim();
  let foundChat = false;
  let chatSessionLabel = targetChat ? `@${targetChat}` : 'Chat Thread #1';

  if (targetChat) {
    sender.send('capture:log', {
      caseId,
      platform,
      text: `[CHATS] 🔍 Locating specific conversation thread for user: @${targetChat}...`,
      type: 'info'
    });

    // Strategy 1: Scan visible sidebar conversation rows for exact/partial contact name match
    try {
      const matchTarget = await page.evaluate((target) => {
        const rows = Array.from(document.querySelectorAll('a[href*="/direct/t/"], div[role="button"], div[role="listitem"]'));
        for (const r of rows) {
          const text = (r.innerText || '').toLowerCase();
          if (text.includes(target.toLowerCase())) {
            r.scrollIntoView({ block: 'center' });
            const rect = r.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, name: r.innerText.split('\n')[0] };
            }
          }
        }
        return null;
      }, targetChat);

      if (matchTarget && matchTarget.x > 0 && matchTarget.y > 0) {
        sender.send('capture:log', {
          caseId,
          platform,
          text: `[CHATS] Found matching chat row "${matchTarget.name}". Opening conversation...`,
          type: 'success'
        });
        await page.mouse.click(matchTarget.x, matchTarget.y);
        foundChat = true;
      }
    } catch (_) {}

    // Strategy 2: Use Instagram Inbox Search bar
    if (!foundChat) {
      try {
        const searchInput = page.locator('input[placeholder*="Search" i], input[aria-label*="Search" i]').first();
        if (await searchInput.isVisible({ timeout: 2500 })) {
          await searchInput.click();
          await searchInput.fill(targetChat);
          await searchInput.dispatchEvent('input');
          await new Promise(r => setTimeout(r, 2000));

          const resultClicked = await page.evaluate((target) => {
            const items = Array.from(document.querySelectorAll('div[role="none"] div[role="button"], div[role="listitem"], a[href*="/direct/t/"], div[role="dialog"] div[role="button"]'));
            for (const item of items) {
              if ((item.innerText || '').toLowerCase().includes(target.toLowerCase())) {
                item.click();
                return true;
              }
            }
            if (items.length > 0) {
              items[0].click();
              return true;
            }
            return false;
          }, targetChat);

          if (resultClicked) {
            foundChat = true;
            sender.send('capture:log', {
              caseId,
              platform,
              text: `[CHATS] Selected search result for @${targetChat}. Loading conversation...`,
              type: 'success'
            });
          }
        }
      } catch (_) {}
    }

    // Strategy 3: Direct Profile Message Button Navigation fallback
    if (!foundChat) {
      try {
        sender.send('capture:log', {
          caseId,
          platform,
          text: `[CHATS] Navigating directly to @${targetChat} profile to initiate chat thread...`,
          type: 'info'
        });
        await page.goto(`https://www.instagram.com/${targetChat}/`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 3500));
        await dismissInstagramPopups(page, sender, caseId);

        const msgBtn = page.locator('div[role="button"]:has-text("Message"), button:has-text("Message"), a:has-text("Message")').first();
        if (await msgBtn.isVisible({ timeout: 3500 })) {
          await msgBtn.click();
          foundChat = true;
          sender.send('capture:log', {
            caseId,
            platform,
            text: `[CHATS] Clicked Message button on @${targetChat}'s profile. Direct conversation loaded!`,
            type: 'success'
          });
        }
      } catch (_) {}
    }
  }

  // Fallback: If no specific chat provided or not found, open 1st chat below Messages
  if (!foundChat) {
    sender.send('capture:log', {
      caseId,
      platform,
      text: '[CHATS] Locating 1st conversation thread under Messages list...',
      type: 'info'
    });

    let clickTarget = null;
    try {
      clickTarget = await page.evaluate(() => {
        // Find "Messages" heading
        const all = Array.from(document.querySelectorAll('span, div, h2, h3'));
        const msgHdr = all.find(el => (el.textContent || '').trim() === 'Messages' && el.children.length === 0);
        const hdrBottom = msgHdr ? msgHdr.getBoundingClientRect().bottom : 220;

        // Find all rows in left sidebar below the Messages heading
        const candidates = Array.from(document.querySelectorAll('a[href*="/direct/t/"], div[role="button"], div[role="listitem"], div[tabindex="0"]'));
        const validRows = candidates.filter(row => {
          const r = row.getBoundingClientRect();
          return r.left < 450 && r.top >= (hdrBottom - 10) && r.height >= 40 && r.width >= 120;
        });

        if (validRows.length > 0) {
          const target = validRows[0];
          target.scrollIntoView({ block: 'center' });
          const r = target.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, hasDirectLink: !!target.closest('a[href*="/direct/t/"]') };
        }

        // Fallback: any direct thread link
        const directLink = document.querySelector('a[href*="/direct/t/"]');
        if (directLink) {
          const r = directLink.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, hasDirectLink: true };
        }

        return null;
      });
    } catch (_) {}

    if (clickTarget && clickTarget.x > 0 && clickTarget.y > 0) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: '[CHATS] Found 1st conversation thread. Clicking to open chat history...',
        type: 'info'
      });
      await page.mouse.click(clickTarget.x, clickTarget.y);
    } else {
      // Fallback locator clicks
      try {
        const fallback = page.locator('a[href*="/direct/t/"], div[role="list"] a, div[aria-label="Chats"] div[role="button"]').first();
        if (await fallback.isVisible({ timeout: 2500 })) {
          await fallback.click({ force: true });
        }
      } catch (_) {}
    }
  }

  await new Promise(r => setTimeout(r, 4000));
  await dismissInstagramPopups(page, sender, caseId);

  sender.send('capture:log', {
    caseId,
    platform,
    text: `[CAPTURE] Starting 3-second continuous scroll & screenshot capture for ${chatSessionLabel}...`,
    type: 'info'
  });

  let seq = 1;
  const maxChatSnapshots = 12;
  for (let i = 0; i < maxChatSnapshots; i++) {
    if (captureSession.stopRequested || page.isClosed()) break;
    await takeAndSaveScreenshot(captureSession, 'instagram_chat_thread_1', seq++, sender);
    if (i < maxChatSnapshots - 1) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[SCROLL] Scrolled chat conversation (Snapshot #${seq - 1} captured). Next snapshot in 3s...`,
        type: 'info'
      });
      await scrollActiveChatPane(page, 'up');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/**
 * 2. FACEBOOK FORENSIC PIPELINE
 */
async function handleFacebookFlow(captureSession, sender) {
  const { caseId, platform } = captureSession;
  const page = browserEngine.page;
  if (!page || page.isClosed()) return;

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[AUTH] Monitoring Facebook login, 2FA codes & security checkpoints...',
    type: 'info'
  });

  const loggedIn = await waitForPlatformLoginOrCaptcha(page, 'facebook', sender, caseId);
  if (!loggedIn) throw new Error('Facebook authentication not completed.');

  await dismissFacebookPopups(page, sender, caseId);

  // Profile Navigation & Metrics
  let username = captureSession.targetUsername;
  sender.send('capture:log', {
    caseId,
    platform,
    text: `[NAV] Navigating to Facebook Profile${username ? ` (@${username})` : ''}...`,
    type: 'info'
  });

  if (username) {
    await page.goto(`https://www.facebook.com/${username}`, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto('https://www.facebook.com/me', { waitUntil: 'domcontentloaded' });
  }
  await new Promise(r => setTimeout(r, 3500));
  await dismissFacebookPopups(page, sender, caseId);

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[PROFILE] Extracting Facebook friends, followers & profile info...',
    type: 'info'
  });

  let metrics = { friends: 'N/A', followers: 'N/A' };
  try {
    metrics = await page.evaluate(() => {
      const text = document.body.innerText;
      const friendsMatch = text.match(/([\d,\.KkMm]+)\s*(?:friends|mutual friends)/i);
      const followersMatch = text.match(/([\d,\.KkMm]+)\s*(?:followers|follower)/i);
      return {
        friends: friendsMatch ? friendsMatch[1] : 'N/A',
        followers: followersMatch ? followersMatch[1] : 'N/A'
      };
    });
  } catch (_) {}

  sender.send('capture:log', {
    caseId,
    platform,
    text: `[PROFILE METRICS] 📊 Friends: ${metrics.friends} | Followers: ${metrics.followers}`,
    type: 'success'
  });

  await takeAndSaveScreenshot(captureSession, 'facebook_profile_overview', 1, sender);
  if (captureSession.stopRequested || page.isClosed()) return;

  // Messenger Chats & 1st Conversation
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[NAV] Navigating to Facebook Messenger Chats...',
    type: 'info'
  });

  await page.goto('https://www.facebook.com/messages/t/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  await dismissFacebookPopups(page, sender, caseId);

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CHATS] Locating first conversation thread in Messenger...',
    type: 'info'
  });

  const chatSelectors = [
    'div[role="navigation"] div[role="row"]',
    'div[role="navigation"] div[role="gridcell"]',
    'div[role="navigation"] a[href*="/messages/t/"]',
    'div[aria-label="Chats"] div[role="row"]'
  ];

  for (const cSel of chatSelectors) {
    try {
      const firstChat = page.locator(cSel).first();
      if (await firstChat.isVisible({ timeout: 2500 })) {
        await firstChat.click();
        sender.send('capture:log', {
          caseId,
          platform,
          text: '[CHATS] Opened 1st Messenger conversation.',
          type: 'success'
        });
        break;
      }
    } catch (_) {}
  }

  await new Promise(r => setTimeout(r, 3000));

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CAPTURE] Commencing 3-second continuous scroll & screenshot capture for Messenger Chat #1...',
    type: 'info'
  });

  let seq = 1;
  const maxChatSnapshots = 12;
  for (let i = 0; i < maxChatSnapshots; i++) {
    if (captureSession.stopRequested || page.isClosed()) break;
    await takeAndSaveScreenshot(captureSession, 'facebook_chat_thread_1', seq++, sender);
    if (i < maxChatSnapshots - 1) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[SCROLL] Scrolled Messenger chat (Snapshot #${seq - 1} captured). Next snapshot in 3s...`,
        type: 'info'
      });
      await scrollActiveChatPane(page, 'up');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/**
 * 3. TWITTER / X FORENSIC PIPELINE
 */
async function handleTwitterFlow(captureSession, sender) {
  const { caseId, platform } = captureSession;
  const page = browserEngine.page;
  if (!page || page.isClosed()) return;

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[AUTH] Monitoring Twitter/X login, Arkose CAPTCHA & 2FA verification...',
    type: 'info'
  });

  const loggedIn = await waitForPlatformLoginOrCaptcha(page, 'twitter', sender, caseId);
  if (!loggedIn) throw new Error('Twitter/X authentication not completed.');

  // Profile Navigation & Metrics
  let username = captureSession.targetUsername;
  sender.send('capture:log', {
    caseId,
    platform,
    text: `[NAV] Navigating to Twitter/X Profile${username ? ` (@${username})` : ''}...`,
    type: 'info'
  });

  if (username) {
    await page.goto(`https://x.com/${username}`, { waitUntil: 'domcontentloaded' });
  } else {
    try {
      const profileBtn = page.locator('a[aria-label*="Profile" i], a[href*="/i/me"]').first();
      await profileBtn.click();
    } catch (_) {
      await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
    }
  }
  await new Promise(r => setTimeout(r, 3500));

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[PROFILE] Extracting followers, following & post stats on Twitter/X...',
    type: 'info'
  });

  let metrics = { posts: 'N/A', followers: 'N/A', following: 'N/A' };
  try {
    metrics = await page.evaluate(() => {
      const text = document.body.innerText;
      const followersMatch = text.match(/([\d,\.KkMm]+)\s*(?:Followers|Follower)/i);
      const followingMatch = text.match(/([\d,\.KkMm]+)\s*(?:Following)/i);
      const postsMatch = text.match(/([\d,\.KkMm]+)\s*(?:posts|Tweets|post)/i);
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

  await takeAndSaveScreenshot(captureSession, 'twitter_profile_overview', 1, sender);
  if (captureSession.stopRequested || page.isClosed()) return;

  // Direct Messages & 1st DM Auto-Scroll
  sender.send('capture:log', {
    caseId,
    platform,
    text: '[NAV] Navigating to Twitter/X Direct Messages...',
    type: 'info'
  });

  await page.goto('https://x.com/messages', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CHATS] Locating first conversation thread in Messages...',
    type: 'info'
  });

  const chatSelectors = [
    'div[data-testid="conversation"]',
    'div[aria-label="Timeline: Messages"] div[role="button"]',
    'div[aria-label="Timeline: Direct Messages"] div[role="button"]'
  ];

  for (const cSel of chatSelectors) {
    try {
      const firstChat = page.locator(cSel).first();
      if (await firstChat.isVisible({ timeout: 2500 })) {
        await firstChat.click();
        sender.send('capture:log', {
          caseId,
          platform,
          text: '[CHATS] Opened 1st Twitter DM thread.',
          type: 'success'
        });
        break;
      }
    } catch (_) {}
  }

  await new Promise(r => setTimeout(r, 3000));

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CAPTURE] Commencing 3-second continuous scroll & screenshot capture for Twitter DM #1...',
    type: 'info'
  });

  let seq = 1;
  const maxChatSnapshots = 12;
  for (let i = 0; i < maxChatSnapshots; i++) {
    if (captureSession.stopRequested || page.isClosed()) break;
    await takeAndSaveScreenshot(captureSession, 'twitter_chat_thread_1', seq++, sender);
    if (i < maxChatSnapshots - 1) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[SCROLL] Scrolled Twitter DM thread (Snapshot #${seq - 1} captured). Next snapshot in 3s...`,
        type: 'info'
      });
      await scrollActiveChatPane(page, 'up');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/**
 * 4. WHATSAPP WEB FORENSIC PIPELINE
 */
async function handleWhatsAppFlow(captureSession, sender) {
  const { caseId, platform } = captureSession;
  const page = browserEngine.page;
  if (!page || page.isClosed()) return;

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[AUTH] Monitoring WhatsApp Web QR Code Link & Session readiness...',
    type: 'info'
  });

  const loggedIn = await waitForPlatformLoginOrCaptcha(page, 'whatsapp', sender, caseId);
  if (!loggedIn) throw new Error('WhatsApp Web linking not completed.');

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[PROFILE] Analyzing active WhatsApp Web account details...',
    type: 'info'
  });

  await new Promise(r => setTimeout(r, 3000));
  await takeAndSaveScreenshot(captureSession, 'whatsapp_chats_overview', 1, sender);

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CHATS] Locating 1st conversation thread in WhatsApp chat list...',
    type: 'info'
  });

  const chatSelectors = [
    'div#pane-side div[role="row"]',
    'div#pane-side div._ak72',
    'div#pane-side div[role="gridcell"]',
    'div[aria-label="Chat list"] div[role="listitem"]'
  ];

  for (const cSel of chatSelectors) {
    try {
      const firstChat = page.locator(cSel).first();
      if (await firstChat.isVisible({ timeout: 3000 })) {
        await firstChat.click();
        sender.send('capture:log', {
          caseId,
          platform,
          text: '[CHATS] Opened 1st WhatsApp conversation thread.',
          type: 'success'
        });
        break;
      }
    } catch (_) {}
  }

  await new Promise(r => setTimeout(r, 3000));

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CAPTURE] Commencing 3-second continuous scroll & screenshot capture for WhatsApp Chat #1...',
    type: 'info'
  });

  let wSeq = 1;
  const maxWChatSnapshots = 12;
  for (let i = 0; i < maxWChatSnapshots; i++) {
    if (captureSession.stopRequested || page.isClosed()) break;
    await takeAndSaveScreenshot(captureSession, 'whatsapp_chat_thread_1', wSeq++, sender);
    if (i < maxWChatSnapshots - 1) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[SCROLL] Scrolled WhatsApp chat (Snapshot #${wSeq - 1} captured). Next snapshot in 3s...`,
        type: 'info'
      });
      await scrollActiveChatPane(page, 'up');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/**
 * 5. TELEGRAM WEB FORENSIC PIPELINE
 */
async function handleTelegramFlow(captureSession, sender) {
  const { caseId, platform } = captureSession;
  const page = browserEngine.page;
  if (!page || page.isClosed()) return;

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[AUTH] Monitoring Telegram Web QR / SMS Code verification...',
    type: 'info'
  });

  const loggedIn = await waitForPlatformLoginOrCaptcha(page, 'telegram', sender, caseId);
  if (!loggedIn) throw new Error('Telegram Web authentication not completed.');

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[PROFILE] Analyzing active Telegram account & dialogs...',
    type: 'info'
  });

  await new Promise(r => setTimeout(r, 3000));
  await takeAndSaveScreenshot(captureSession, 'telegram_chats_overview', 1, sender);

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CHATS] Locating 1st conversation thread in Telegram chat list...',
    type: 'info'
  });

  const chatSelectors = [
    'div.chatlist-chat',
    'div.chat-list > a',
    'div.chat-list div.chat-item',
    'li.chatlist-chat'
  ];

  for (const cSel of chatSelectors) {
    try {
      const firstChat = page.locator(cSel).first();
      if (await firstChat.isVisible({ timeout: 3000 })) {
        await firstChat.click();
        sender.send('capture:log', {
          caseId,
          platform,
          text: '[CHATS] Opened 1st Telegram conversation thread.',
          type: 'success'
        });
        break;
      }
    } catch (_) {}
  }

  await new Promise(r => setTimeout(r, 3000));

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CAPTURE] Commencing 3-second continuous scroll & screenshot capture for Telegram Chat #1...',
    type: 'info'
  });

  let seq = 1;
  const maxChatSnapshots = 12;
  for (let i = 0; i < maxChatSnapshots; i++) {
    if (captureSession.stopRequested || page.isClosed()) break;
    await takeAndSaveScreenshot(captureSession, 'telegram_chat_thread_1', seq++, sender);
    if (i < maxChatSnapshots - 1) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[SCROLL] Scrolled Telegram chat (Snapshot #${seq - 1} captured). Next snapshot in 3s...`,
        type: 'info'
      });
      await scrollActiveChatPane(page, 'up');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/**
 * 6. GOOGLE / GMAIL FORENSIC PIPELINE
 */
async function handleGoogleFlow(captureSession, sender) {
  const { caseId, platform } = captureSession;
  const page = browserEngine.page;
  if (!page || page.isClosed()) return;

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[AUTH] Monitoring Google Account 2FA, Passkey & verification prompt...',
    type: 'info'
  });

  const loggedIn = await waitForPlatformLoginOrCaptcha(page, 'google', sender, caseId);
  if (!loggedIn) throw new Error('Google authentication not completed.');

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[NAV] Navigating to Google Account Profile & Security Overview...',
    type: 'info'
  });

  await page.goto('https://myaccount.google.com/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3500));
  await takeAndSaveScreenshot(captureSession, 'google_account_overview', 1, sender);

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[NAV] Navigating to Gmail Inbox...',
    type: 'info'
  });

  await page.goto('https://mail.google.com/mail/u/0/#inbox', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  try {
    const firstMail = page.locator('table[role="grid"] tr[role="row"]').first();
    if (await firstMail.isVisible({ timeout: 3000 })) {
      await firstMail.click();
      sender.send('capture:log', {
        caseId,
        platform,
        text: '[CHATS] Opened 1st message thread in Gmail inbox.',
        type: 'success'
      });
    }
  } catch (_) {}

  await new Promise(r => setTimeout(r, 3000));

  sender.send('capture:log', {
    caseId,
    platform,
    text: '[CAPTURE] Commencing 3-second continuous scroll & screenshot capture for Gmail message thread...',
    type: 'info'
  });

  let gSeq = 1;
  const maxGChatSnapshots = 12;
  for (let i = 0; i < maxGChatSnapshots; i++) {
    if (captureSession.stopRequested || page.isClosed()) break;
    await takeAndSaveScreenshot(captureSession, 'google_message_thread_1', gSeq++, sender);
    if (i < maxGChatSnapshots - 1) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[SCROLL] Scrolled Gmail message thread (Snapshot #${gSeq - 1} captured). Next snapshot in 3s...`,
        type: 'info'
      });
      await scrollActiveChatPane(page, 'down');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/**
 * GENERIC FALLBACK FORENSIC PIPELINE
 */
async function handleGenericPlatformFlow(captureSession, sender) {
  const { caseId, platform, platformConfig } = captureSession;
  const sections = platformConfig.sections || {};

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

    if (sectionConfig.nav_selector) {
      try {
        await browserEngine.click(sectionConfig.nav_selector);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (navError) {
        console.warn(`Could not navigate to ${sectionName} using nav_selector:`, navError.message);
      }
    }

    await captureSection(captureSession, sectionName, sectionConfig, sender);
  }
}

/**
 * Smoothly scroll the active chat message thread pane (up for history or down)
 * Uses native mouse wheel, keyboard PageUp/Down, and DOM scrollBy
 */
async function scrollActiveChatPane(page, direction = 'up') {
  if (!page || page.isClosed()) return;
  const deltaY = direction === 'up' ? -650 : 650;
  const key = direction === 'up' ? 'PageUp' : 'PageDown';

  try {
    // 1. Position mouse in center of message thread area (right pane, x: ~680px, y: ~450px)
    await page.mouse.move(680, 450);
    // 2. Dispatch native mouse wheel scroll (triggers React virtual scroll & infinite loading)
    await page.mouse.wheel(0, deltaY);
    await new Promise(r => setTimeout(r, 250));

    // 3. Press PageUp / PageDown key
    await page.keyboard.press(key);

    // 4. Fallback DOM element scrolling on right pane containers
    await page.evaluate((dY) => {
      const divs = Array.from(document.querySelectorAll('div, section, main, ul'));
      const scrollables = divs.filter(el => {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const hasScroll = el.scrollHeight > el.clientHeight && el.clientHeight > 150;
        const isRightPane = r.left > 280 && r.width > 250;
        return hasScroll && isRightPane && style.overflowY !== 'hidden';
      });

      if (scrollables.length > 0) {
        scrollables.forEach(s => s.scrollBy({ top: dY, behavior: 'smooth' }));
      } else {
        window.scrollBy({ top: dY, behavior: 'smooth' });
      }
    }, deltaY);
  } catch (_) {}
}

/**
 * Universal Dialog Dismissal for Instagram / Facebook
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

async function dismissFacebookPopups(page, sender, caseId) {
  if (!page || page.isClosed()) return;
  const popupSelectors = [
    'button[data-cookiebanner="accept_button"]',
    'button:has-text("Allow all cookies")',
    'button:has-text("Accept All")',
    'div[role="dialog"] button[aria-label="Close"]',
    'div[role="dialog"] button:has-text("Not Now")'
  ];

  for (const pSel of popupSelectors) {
    try {
      const btn = page.locator(pSel).first();
      if (await btn.isVisible({ timeout: 1200 })) {
        await btn.click();
        sender.send('capture:log', { caseId, platform: 'facebook', text: '[INFO] Dismissed dialog prompt.', type: 'info' });
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (_) {}
  }
}

/**
 * Universal Multi-Platform Login, 2FA, QR & CAPTCHA Verification Monitor
 */
async function waitForPlatformLoginOrCaptcha(page, platform, sender, caseId) {
  if (!page || page.isClosed()) return false;

  let challengeNotified = false;
  let lastErrorNotified = '';
  const maxWaitMs = 300000; // 5 minutes wait time for login / OTP / CAPTCHA
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    if (page.isClosed()) return false;

    let sessionState = { isLoggedIn: false };
    let hasChallenge = false;

    // 1. Check Authenticated Session Cookies via Playwright Browser Context
    let isCookieAuth = false;
    try {
      const cookies = await page.context().cookies();
      const platLower = platform.toLowerCase();

      if (platLower === 'instagram') {
        isCookieAuth = cookies.some(c => c.name === 'sessionid' && c.value && c.value.length > 5);
      } else if (platLower === 'facebook') {
        isCookieAuth = cookies.some(c => (c.name === 'c_user' || c.name === 'xs') && c.value);
      } else if (platLower === 'twitter' || platLower === 'x') {
        isCookieAuth = cookies.some(c => (c.name === 'auth_token' || c.name === 'twid') && c.value);
      } else if (platLower === 'google' || platLower === 'gmail') {
        isCookieAuth = cookies.some(c => (c.name === 'SID' || c.name === 'SSID' || c.name === 'HSID') && c.value);
      }
    } catch (_) {}

    // 2. Check DOM Elements
    try {
      sessionState = await page.evaluate((plat) => {
        const text = document.body?.innerText || '';
        const url = window.location.href || '';

        // 1. WhatsApp Web Login Check
        if (plat === 'whatsapp') {
          const isLinked = !!document.querySelector('div#pane-side, div[aria-label="Chat list"], div[role="row"]');
          const hasQr = !!document.querySelector('canvas, div[data-ref]');
          return { isLoggedIn: isLinked, hasQr };
        }

        // 2. Telegram Web Login Check
        if (plat === 'telegram') {
          const isLinked = !!document.querySelector('div.chatlist-chat, div.chat-list, div.sidebar-header');
          const hasQr = !!document.querySelector('canvas, div.qr-container');
          return { isLoggedIn: isLinked, hasQr };
        }

        // 3. Instagram DOM Check (Explicit Authenticated Icons)
        if (plat === 'instagram') {
          const hasDirect = !!document.querySelector('a[href*="/direct/inbox/"], a[href*="/direct/t/"]');
          const svgs = Array.from(document.querySelectorAll('svg[aria-label]'));
          const hasNavIcons = svgs.some(s => {
            const label = (s.getAttribute('aria-label') || '').toLowerCase();
            return label === 'direct' || label === 'messenger' || label === 'messages';
          });
          const hasLogoutOrSettings = !!document.querySelector('a[href*="/accounts/edit/"], svg[aria-label="Settings"]');

          const errorAlert = document.querySelector('p#slfErrorAlert, div[role="alert"]')?.innerText || '';
          const onLoginPage = !!document.querySelector("input[name='password'], input[name='username']");
          return { isLoggedIn: hasDirect || hasNavIcons || hasLogoutOrSettings, errorAlert, onLoginPage };
        }

        // 4. Facebook Login Check
        if (plat === 'facebook') {
          const hasLoggedInNav = !!document.querySelector('a[aria-label="Messenger"], a[aria-label="Your profile"]');
          const onLoginPage = !!document.querySelector("input[name='pass'], input#email");
          return { isLoggedIn: hasLoggedInNav, onLoginPage };
        }

        // 5. Twitter / X Login Check
        if (plat === 'twitter' || plat === 'x') {
          const hasLoggedInNav = !!document.querySelector('a[aria-label="Direct Messages"], a[data-testid="AppTabBar_DirectMessage_Link"]');
          const onLoginPage = !!document.querySelector("input[autocomplete='username'], input[name='password']");
          return { isLoggedIn: hasLoggedInNav, onLoginPage };
        }

        // 6. Google Login Check
        if (plat === 'google' || plat === 'gmail') {
          const hasLoggedInNav = !!document.querySelector('a[href*="SignOutOptions"]') || Array.from(document.querySelectorAll('a[aria-label]')).some(a => (a.getAttribute('aria-label') || '').toLowerCase().includes('google account'));
          const onLoginPage = !!document.querySelector("input[type='password'], input[type='email']");
          return { isLoggedIn: hasLoggedInNav, onLoginPage };
        }

        return { isLoggedIn: false };
      }, platform.toLowerCase());
    } catch (_) {
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }

    const isFullyAuthenticated = isCookieAuth || sessionState.isLoggedIn;

    // Successfully logged in!
    if (isFullyAuthenticated) {
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[AUTH] Authenticated session confirmed on ${platform.toUpperCase()}! Moving forward to profile capture...`,
        type: 'success'
      });
      return true;
    }

    // Check for login credential errors (e.g. wrong password)
    if (sessionState.errorAlert && sessionState.errorAlert !== lastErrorNotified) {
      lastErrorNotified = sessionState.errorAlert;
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[AUTH ERROR] Login notice from ${platform.toUpperCase()}: "${sessionState.errorAlert}". Please enter correct credentials in the Chromium window.`,
        type: 'error'
      });
    }

    // Generic CAPTCHA / 2FA / QR Challenge Detection
    try {
      hasChallenge = await page.evaluate(() => {
        const text = document.body?.innerText || '';
        return (
          text.includes('Confirm that it’s you') ||
          text.includes('Help us confirm it') ||
          text.includes('Security Check') ||
          text.includes('Enter code') ||
          text.includes('two-factor') ||
          text.includes('robot') ||
          text.includes('Authenticate') ||
          text.includes('Passkey') ||
          text.includes('Suspicious login') ||
          text.includes('Check your phone') ||
          !!document.querySelector('iframe[src*="recaptcha"], iframe[src*="arkose"], iframe[src*="captcha"], #captcha, div.checkpoint')
        );
      });
    } catch (_) {}

    if (hasChallenge && !challengeNotified) {
      challengeNotified = true;
      sender.send('capture:log', {
        caseId,
        platform,
        text: `[SECURITY] ⏳ Verification Challenge (CAPTCHA / 2FA / Checkpoint) detected on ${platform.toUpperCase()}! Please solve the CAPTCHA in the opened Chromium window. The automation is waiting for you and will automatically resume once solved.`,
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
      timestamp: metadata.timestamp || new Date().toISOString(),
      hash: metadata.sha256_hash,
      artifact: {
        id: metadata.screenshot_id || `SCR-${String(sequenceNumber).padStart(3, '0')}`,
        caseId: captureSession.caseId,
        platform: captureSession.platform,
        section: sectionName,
        sequenceNumber: sequenceNumber,
        filePath: filePath,
        hash: metadata.sha256_hash,
        timestamp: metadata.timestamp || new Date().toISOString()
      }
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

    // 2. Identify Username Field & fill React input
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
        if (await el.isVisible({ timeout: 3000 })) {
          await el.click();
          await el.fill('');
          await el.fill(creds.username);
          await el.dispatchEvent('input');
          await el.dispatchEvent('change');
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

    // 4. Identify Password Field & fill React input
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
            await pEl.fill('');
            await pEl.fill(creds.password);
            await pEl.dispatchEvent('input');
            await pEl.dispatchEvent('change');
            sender.send('capture:log', { caseId, platform, text: `[AUTH] Entered password into secure field. Submitting login...`, type: 'info' });
            await new Promise(r => setTimeout(r, 500));
            // Press Enter to submit
            await pEl.press('Enter');
            break;
          }
        } catch (_) {}
      }
    }

    await new Promise(r => setTimeout(r, 800));

    // 5. Submit Login Form (Fallback Click)
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
        if (await sEl.isVisible({ timeout: 1500 })) {
          await sEl.click({ force: true });
          sender.send('capture:log', { caseId, platform, text: `[AUTH] Clicked Log In submit button. Awaiting authentication...`, type: 'success' });
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