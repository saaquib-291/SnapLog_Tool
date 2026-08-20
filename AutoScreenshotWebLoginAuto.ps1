# Auto Screenshot Web Automation with AUTOMATIC LOGIN
# WARNING: THIS SCRIPT AUTOMATES CREDENTIAL ENTRY - USE ONLY ON TRUSTED SYSTEMS
# LAUNCHES BROWSER, AUTOMATICALLY ENTERS CREDENTIALS, NAVIGATES TO MESSAGES, TAKES PERIODIC SCREENSHOTS
#
# SECURITY RISKS:
# - Credentials are visible in process list and script parameters
# - Potential for credential theft if script is accessed
# - May violate website terms of service
# - Could trigger security alerts or account locks
# - SendKeys is unreliable and may fail if window focus changes
#
# ONLY USE FOR:
# - Personal accounts on trusted, secured systems
# - Test accounts with no sensitive information
# - Environments where security risks are understood and accepted
#
# ALTERNATIVE: Use AutoScreenshotWebLogin.ps1 for secure manual login

param(
    [string]$LoginUrl = "https://www.facebook.com",
    [string]$Username = "",
    [string]$Password = "",
    [string]$Platform = "facebook",
    [int]$IntervalSeconds = 3,  # 3 seconds default
    [string]$OutputDirectory = "$HOME\Pictures\Screenshots\WebAutoCaptureLoginAuto",
    [string]$FilenamePrefix = "web_screenshot_auto",
    [switch]$CaptureAllMonitors,
    [int]$WaitForLoadSeconds = 5,
    [int]$WaitAfterLoginSeconds = 5,
    [int]$SendKeyDelay = 100  # Delay between keystrokes in milliseconds
)

# SECURITY WARNING
Write-Host "`n=== SECURITY WARNING ===" -ForegroundColor Red
Write-Host "THIS SCRIPT AUTOMATES CREDENTIAL ENTRY" -ForegroundColor Red
Write-Host "YOUR USERNAME AND PASSWORD WILL BE VISIBLE IN:" -ForegroundColor Red
Write-Host "  - PROCESS LIST (while script runs)" -ForegroundColor Red
Write-Host "  - SCRIPT PARAMETERS (if inspected)" -ForegroundColor Red
Write-Host "  - POWERShell HISTORY (if not cleared)" -ForegroundColor Red
Write-Host ""

if (-not $Username -or -not $Password) {
    Write-Warning "Username and password are required for automatic login!"
    Write-Host "Please provide both -Username and -Password parameters."
    Write-Host "Example: .\AutoScreenshotWebLoginAuto.ps1 -Username 'user@example.com' -Password 'mypassword' -IntervalSeconds 300"
    Write-Host ""
    Write-Host "FOR SECURE MANUAL LOGIN INSTEAD, USE:" -ForegroundColor Yellow
    Write-Host "  .\AutoScreenshotWebLogin.ps1 -Platform facebook -IntervalSeconds 300" -ForegroundColor Yellow
    Write-Host ""
    exit
}

# Ensure output directory exists
if (-not (Test-Path $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
}

# Function to capture screenshot
function Capture-Screenshot {
    param(
        [string]$OutputPath,
        [switch]$AllMonitors
    )

    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms

    if ($AllMonitors) {
        # Capture all monitors (virtual screen)
        $width = [System.Windows.Forms.SystemInformation]::VirtualScreen.Width
        $height = [System.Windows.Forms.SystemInformation]::VirtualScreen.Height
        $left = [System.Windows.Forms.SystemInformation]::VirtualScreen.Left
        $top = [System.Windows.Forms.SystemInformation]::VirtualScreen.Top
    } else {
        # Capture primary monitor only
        $width = [System.Windows.Forms.SystemInformation]::PrimaryMonitorSize.Width
        $height = [System.Windows.Forms.SystemInformation]::PrimaryMonitorSize.Height
        $left = [System.Windows.Forms.SystemInformation]::PrimaryMonitorBounds.Left
        $top = [System.Windows.Forms.SystemInformation]::PrimaryMonitorBounds.Top
    }

    # Create bitmap and graphics object
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)

    # Copy from screen
    $graphics.CopyFromScreen($left, $top, 0, 0, $bmp.Size)

    # Save image
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
}

# Function to send keystrokes with delay
function Send-KeystrokeDelay {
    param([string]$Keys)
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
    Start-Sleep -Milliseconds $SendKeyDelay
}

# Function to show usage help
function Show-Help {
    Write-Host @"
Auto Screenshot Web Automation with AUTOMATIC LOGIN

WARNING: THIS SCRIPT AUTOMATES CREDENTIAL ENTRY - SECURITY RISKS INCLUDE:
- Credentials visible in process list and script parameters
- Potential credential theft if script is accessed
- Violation of website terms of service
- Possible account locks or security alerts
- Unreliable SendKeys automation

THIS IS PROVIDED ONLY AS REQUESTED. USE THE SECURE VERSION (AutoScreenshotWebLogin.ps1) INSTEAD WHENEVER POSSIBLE.

Usage:
  .\AutoScreenshotWebLoginAuto.ps1 -Username "your@email.com" -Password "yourpassword" -Platform facebook -IntervalSeconds 300

Parameters:
  -LoginUrl           : Login page URL (default: https://www.facebook.com)
  -Username           : Login username/email (REQUIRED - SECURITY RISK)
  -Password           : Login password (REQUIRED - SECURITY RISK)
  -Platform           : Platform identifier for navigation logic (facebook, instagram, whatsapp, twitter)
  -IntervalSeconds    : Time between screenshots in seconds (default: 300 = 5 minutes)
  -OutputDirectory    : Directory to save screenshots (default: $HOME\Pictures\Screenshots\WebAutoCaptureLoginAuto)
  -FilenamePrefix     : Prefix for screenshot filenames (default: "web_screenshot_auto")
  -CaptureAllMonitors : Switch to capture all monitors instead of just primary
  -WaitForLoadSeconds : Seconds to wait for page load (default: 5)
  -WaitAfterLoginSeconds: Seconds to wait after login submit (default: 5)
  -SendKeyDelay       : Delay between keystrokes in milliseconds (default: 100)
  -Help               : Show this help message

Platform Examples:
  facebook:  LoginUrl = https://www.facebook.com
             Username field: usually ID="email" or name="email"
             Password field: usually ID="pass" or name="pass"
             Login button: usually name="login" or ID="loginbutton"

  instagram: LoginUrl = https://www.instagram.com/accounts/login/
             Username field: usually name="username"
             Password field: usually name="password"
             Login button: usually button[type="submit"]

  whatsapp:  LoginUrl = https://web.whatsapp.com
             (Note: WhatsApp Web uses QR code, not username/password - this script won't work for WhatsApp login)

  twitter:   LoginUrl = https://twitter.com/login
             Username field: usually name="text"
             Password field: usually name="password"
             Login button: usually css-selector "[data-testid='LoginForm_Login_Button']"

After launching, the script will:
1. Open browser to login page
2. Wait for page to load
3. AUTOMATICALLY ENTER USERNAME AND PASSWORD (INSECURE)
4. Submit login form
5. Wait for login to process
6. Attempt to navigate to messages section
7. Wait for page to load
8. Take initial screenshot
9. Continue capturing screenshots every [$IntervalSeconds seconds]
10. Stop with Ctrl+C

SECURITY ALTERNATIVE: Use AutoScreenshotWebLogin.ps1 for secure manual login

Examples:
  # Facebook (AUTOMATIC LOGIN - INSECURE)
  .\AutoScreenshotWebLoginAuto.ps1 -Username "fb@email.com" -Password "fbpass" -Platform facebook -IntervalSeconds 300

  # Instagram (AUTOMATIC LOGIN - INSECURE)
  .\AutoScreenshotWebLoginAuto.ps1 -Username "iguser" -Password "igpass" -Platform instagram -IntervalSeconds 300
"@
}

# Handle help parameter
if ($LoginUrl -eq "Help" -or $LoginUrl -eq "/?" -or $LoginUrl -eq "-Help" -or $Username -eq "Help" -or $Password -eq "Help") {
    Show-Help
    exit
}

# Validate URLs
if (-not $LoginUrl.StartsWith("http")) {
    Write-Warning "Login URL should start with http:// or https://"
    $LoginUrl = "https://$LoginUrl"
}

Write-Host "`n=== AUTO SCREENSHOT WEB AUTOMATION WITH AUTOMATIC LOGIN ===" -ForegroundColor Yellow
Write-Host "LAUNCHING BROWSER TO: $LoginUrl" -ForegroundColor Yellow
Write-Host "USERNAME: $Username" -ForegroundColor Yellow
Write-Host "PASSWORD: [HIDDEN]" -ForegroundColor Yellow
Write-Host "PLATFORM: $Platform" -ForegroundColor Yellow
Write-Host "INTERVAL: $IntervalSeconds seconds" -ForegroundColor Yellow
Write-Host "OUTPUT: $OutputDirectory" -ForegroundColor Yellow
Write-Host "`n=== SECURITY RISKS ACTIVE ===" -ForegroundColor Red
Write-Host "Credentials are visible in process list and parameters!" -ForegroundColor Red
Write-Host "ONLY USE ON TRUSTED SYSTEMS WITH ACCEPTABLE RISK!" -ForegroundColor Red
Write-Host ""

# Launch browser using default system browser
try {
    Start-Process $LoginUrl | Out-Null
    Write-Host "Browser launched successfully to $LoginUrl"
} catch {
    Write-Warning "Failed to launch browser: $_"
    Write-Warning "Please manually open $LoginUrl in your browser and continue..."
    # Continue anyway - user might have browser open already
}

# Wait for page to load
Write-Host "Waiting [$WaitForLoadSeconds seconds] for login page to load..."
Start-Sleep -Seconds $WaitForLoadSeconds

# Attempt to automate login using SendKeys
# NOTE: This is fragile and depends on window focus, field tab order, etc.
try {
    Write-Host "Attempting to enter username..."
    Send-KeystrokeDelay $Username

    Write-Host "Pressing Tab to move to password field..."
    Send-KeystrokeDelay "{TAB}"

    Write-Host "Entering password..."
    Send-KeystrokeDelay $Password

    Write-Host "Pressing Enter to submit login..."
    Send-KeystrokeDelay "{ENTER}"

} catch {
    Write-Warning "Error during automated login attempt: $_"
    Write-Host "Continuing anyway - login may have failed..."
}

# Wait for login to process
Write-Host "Waiting [$WaitAfterLoginSeconds seconds] for login to process..."
Start-Sleep -Seconds $WaitAfterLoginSeconds

# Navigate to messages section
try {
    Write-Host "Attempting to navigate to messages section..."

    switch ($Platform.ToLower()) {
        "facebook" {
            $messagesUrl = "https://www.facebook.com/messages"
            Write-Host "Navigating to Facebook Messages: $messagesUrl"
            Start-Process $messagesUrl | Out-Null
        }
        "instagram" {
            $messagesUrl = "https://www.instagram.com/direct/inbox/"
            Write-Host "Navigating to Instagram Direct: $messagesUrl"
            Start-Process $messagesUrl | Out-Null
        }
        "whatsapp" {
            Write-Host "WhatsApp Web uses QR code login - automatic username/password login not supported"
            Write-Host "Please ensure you've scanned the QR code manually if needed"
            # WhatsApp Web typically stays at web.whatsapp.com after login
        }
        "twitter" {
            $messagesUrl = "https://twitter.com/messages"
            Write-Host "Navigating to Twitter/X Direct Messages: $messagesUrl"
            Start-Process $messagesUrl | Out-Null
        }
        default {
            Write-Warning "Unknown platform '$Platform'. Please navigate to messages manually."
            Write-Host "Continuing with current page..."
        }
    }

    # Wait for page to load after navigation
    Write-Host "Waiting [$WaitForLoadSeconds seconds] for messages page to load..."
    Start-Sleep -Seconds $WaitForLoadSeconds

} catch {
    Write-Warning "Error during navigation: $_"
    Write-Host "Continuing with current page..."
}

# Optional: Attempt to scroll (basic implementation)
# Note: Reliable automated scrolling is difficult with SendKeys
# Users may need to manually ensure chat is visible
try {
    Write-Host "Attempting to ensure chat visibility (basic PageDown)..."
    Send-KeystrokeDelay "{PGDN}"
    Start-Sleep -Seconds 2
    Send-KeystrokeDelay "{PGUP}"  # Go back up a bit
} catch {
    Write-Warning "Could not send scroll keys: $_"
}

# Capture initial screenshot after navigation/wait
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "${FilenamePrefix}_${timestamp}.png"
$outputPath = Join-Path $OutputDirectory $filename
Capture-Screenshot -OutputPath $outputPath -AllMonitors:$CaptureAllMonitors

Write-Host "Initial screenshot saved to: $outputPath"

# Set up continuous capture if interval specified
if ($IntervalSeconds -gt 0) {
    Write-Host ""
    Write-Host "=== STARTING CONTINUOUS CAPTURE ==="
    Write-Host "Taking screenshots every $IntervalSeconds seconds"
    Write-Host "MAKE SURE THE CHAT REMAINS VISIBLE ON SCREEN"
    Write-Host "Press Ctrl+C to stop capturing"
    Write-Host "=== SECURITY WARNING STILL ACTIVE ===" -ForegroundColor Red

    while ($true) {
        Start-Sleep -Seconds $IntervalSeconds

        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $filename = "${FilenamePrefix}_${timestamp}.png"
        $outputPath = Join-Path $OutputDirectory $filename

        try {
            Capture-Screenshot -OutputPath $outputPath -AllMonitors:$CaptureAllMonitors
            Write-Host "Screenshot saved: $outputPath"
        } catch {
            Write-Warning "Failed to capture screenshot: $_"
        }
    }
}