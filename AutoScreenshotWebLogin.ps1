# Auto Screenshot Web Automation with Login Assistance Script
# Launches browser, waits for manual login, then navigates to messages and takes periodic screenshots
# NOTE: For security reasons, login must be done manually. This script assists with navigation after login.

param(
    [string]$LoginUrl = "https://www.facebook.com",  # Login page URL
    [string]$MessagesUrl = "https://www.facebook.com/messages",  # Direct messages URL (if known)
    [string]$Platform = "facebook",  # Platform identifier for navigation logic
    [int]$IntervalSeconds = 3,  # 3 seconds default
    [string]$OutputDirectory = "$HOME\Pictures\Screenshots\WebAutoCaptureLogin",
    [string]$FilenamePrefix = "web_screenshot",
    [switch]$CaptureAllMonitors,
    [int]$WaitForLoginSeconds = 30,  # Time to wait for manual login
    [int]$WaitForLoadSeconds = 10   # Additional wait after navigation
)

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

# Function to show usage help
function Show-Help {
    Write-Host @"
Auto Screenshot Web Automation with Login Assistance

This script helps automate screenshots AFTER manual login for security reasons.
It will:
1. Launch browser to login page
2. Wait for you to manually login
3. Attempt to navigate to messages section
4. Take periodic screenshots

SECURITY NOTE: Never automate password entry in scripts! This prevents:
- Credential theft if script is accessed
- Account locking due to failed login attempts
- Violation of website terms of service

Usage:
  .\AutoScreenshotWebLogin.ps1 -Platform facebook -IntervalSeconds 300

Parameters:
  -LoginUrl       : Login page URL (default: https://www.facebook.com)
  -MessagesUrl    : Direct messages URL if known (optional)
  -Platform       : Platform identifier for navigation logic (facebook, instagram, whatsapp, twitter)
  -IntervalSeconds: Time between screenshots in seconds (default: 300 = 5 minutes)
  -OutputDirectory: Directory to save screenshots (default: $HOME\Pictures\Screenshots\WebAutoCaptureLogin)
  -FilenamePrefix : Prefix for screenshot filenames (default: "web_screenshot")
  -CaptureAllMonitors: Switch to capture all monitors instead of just primary
  -WaitForLoginSeconds: Seconds to wait for manual login (default: 30)
  -WaitForLoadSeconds : Seconds to wait after navigation (default: 10)
  -Help           : Show this help message

Platform Examples:
  facebook:  LoginUrl = https://www.facebook.com
             MessagesUrl = https://www.facebook.com/messages (or will attempt to navigate)

  instagram: LoginUrl = https://www.instagram.com/accounts/login/
             MessagesUrl = https://www.instagram.com/direct/inbox/

  whatsapp:  LoginUrl = https://web.whatsapp.com
             (uses QR code login, wait for scan)

  twitter:   LoginUrl = https://twitter.com/login
             MessagesUrl = https://twitter.com/messages

After launching, the script will:
1. Open browser to login page
2. Wait [$WaitForLoginSeconds seconds] for you to manually login
3. Attempt to navigate to messages section
4. Wait [$WaitForLoadSeconds seconds] for page to load
5. Take initial screenshot
6. Continue capturing screenshots every [$IntervalSeconds seconds]
7. Stop with Ctrl+C

Examples:
  # Facebook (will wait for manual login, then try to go to messages)
  .\AutoScreenshotWebLogin.ps1 -Platform facebook -IntervalSeconds 300

  # Instagram with custom wait time
  .\AutoScreenshotWebLogin.ps1 -Platform instagram -WaitForLoginSeconds 45 -IntervalSeconds 300

  # WhatsApp Web (wait for QR code scan)
  .\AutoScreenshotWebLogin.ps1 -Platform whatsapp -IntervalSeconds 300
"@
}

# Handle help parameter
if ($LoginUrl -eq "Help" -or $LoginUrl -eq "/?" -or $LoginUrl -eq "-Help") {
    Show-Help
    exit
}

# Validate URLs
if (-not $LoginUrl.StartsWith("http")) {
    Write-Warning "Login URL should start with http:// or https://"
    $LoginUrl = "https://$LoginUrl"
}

if ($MessagesUrl -and -not $MessagesUrl.StartsWith("http")) {
    Write-Warning "Messages URL should start with http:// or https://"
    $MessagesUrl = "https://$MessagesUrl"
}

Write-Host "=== Auto Screenshot Web Automation with Login Assistance ==="
Write-Host "SECURITY NOTE: Login must be done manually for your protection!"
Write-Host "Launching browser to: $LoginUrl"
Write-Host "Platform: $Platform"
Write-Host "Waiting [$WaitForLoginSeconds seconds] for manual login..."
Write-Host "After login, will attempt to navigate to messages section"
if ($MessagesUrl) {
    Write-Host "Using direct messages URL: $MessagesUrl"
} else {
    Write-Host "Will attempt to navigate to messages using platform logic"
}
Write-Host "Then will take screenshots every [$IntervalSeconds seconds]"
Write-Host "Saving to: $OutputDirectory"
Write-Host "Press Ctrl+C to stop the script at any time"
Write-Host ""

# Launch browser using default system browser
try {
    Start-Process $LoginUrl | Out-Null
    Write-Host "Browser launched successfully."
} catch {
    Write-Warning "Failed to launch browser: $_"
    Write-Warning "Please manually open $LoginUrl in your browser and continue..."
}

# Wait for manual login
Write-Host ""
Write-Host "Please complete login manually in the browser window..."
for ($i = $WaitForLoginSeconds; $i -gt 0; $i--) {
    Write-Host -NoNewline "Waiting for login: $i seconds remaining...`r"
    Start-Sleep -Seconds 1
}
Write-Host ""
Write-Host "Login wait period complete. Proceeding with navigation..."

# Navigate to messages section
try {
    if ($MessagesUrl) {
        # Use direct messages URL if provided
        Write-Host "Navigating to messages URL: $MessagesUrl"
        Start-Process $MessagesUrl | Out-Null
    } else {
        # Attempt platform-specific navigation
        Write-Host "Attempting to navigate to messages using platform logic..."
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
                Write-Host "WhatsApp Web uses QR code login - please ensure you've scanned the QR code"
                Write-Host "Navigating to WhatsApp Web main page (should already be there after login)"
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
    }

    # Wait for page to load after navigation
    Write-Host "Waiting [$WaitForLoadSeconds seconds] for page to load..."
    Start-Sleep -Seconds $WaitForLoadSeconds

} catch {
    Write-Warning "Error during navigation: $_"
    Write-Host "Continuing with current page..."
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
    Write-Host "Starting continuous capture every $IntervalSeconds seconds..."
    Write-Host "Make sure the chat/conversation remains visible on screen"
    Write-Host "Press Ctrl+C to stop capturing"

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