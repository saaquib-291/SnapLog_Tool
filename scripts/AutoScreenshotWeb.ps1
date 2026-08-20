# Auto Screenshot Web Automation Script
# Launches browser to specified URL and takes periodic screenshots
# For chat automation: navigate to messages section manually or use direct URLs

param(
    [string]$Url = "https://www.facebook.com",
    [int]$IntervalSeconds = 3,  # 3 seconds default
    [string]$OutputDirectory = "$HOME\Pictures\Screenshots\WebAutoCapture",
    [string]$FilenamePrefix = "web_screenshot",
    [switch]$CaptureAllMonitors,
    [int]$WaitForLoadSeconds = 10  # Time to wait for page load/manual navigation
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
Auto Screenshot Web Automation Script

Usage:
  .\AutoScreenshotWeb.ps1 -Url "https://www.facebook.com/messages" -IntervalSeconds 300

Parameters:
  -Url                    : Website URL to navigate to (default: https://www.facebook.com)
  -IntervalSeconds       : Time between screenshots in seconds (default: 300 = 5 minutes)
  -OutputDirectory       : Directory to save screenshots (default: $HOME\Pictures\Screenshots\WebAutoCapture)
  -FilenamePrefix        : Prefix for screenshot filenames (default: "web_screenshot")
  -CaptureAllMonitors    : Switch to capture all monitors instead of just primary
  -WaitForLoadSeconds    : Seconds to wait for page load/manual navigation before starting screenshots (default: 10)
  -Help                  : Show this help message

Examples:
  # Facebook Messages
  .\AutoScreenshotWeb.ps1 -Url "https://www.facebook.com/messages" -IntervalSeconds 300

  # Instagram Direct
  .\AutoScreenshotWeb.ps1 -Url "https://www.instagram.com/direct/inbox/" -IntervalSeconds 300

  # WhatsApp Web
  .\AutoScreenshotWeb.ps1 -Url "https://web.whatsapp.com" -IntervalSeconds 300

Direct URL Examples for Chats:
  Facebook:  https://www.facebook.com/messages
  Instagram: https://www.instagram.com/direct/inbox/
  WhatsApp:  https://web.whatsapp.com
  Twitter/X: https://twitter.com/messages

After launching, the script will wait for [$WaitForLoadSeconds seconds] for you to:
1. Ensure the page is fully loaded
2. Navigate to the specific chat/conversation you want to monitor
3. Position the chat visible on screen

Then it will automatically take screenshots at the specified interval.
"@
}

# Handle help parameter
if ($Url -eq "Help" -or $Url -eq "/?" -or $Url -eq "-Help") {
    Show-Help
    exit
}

# Validate URL
if (-not $Url.StartsWith("http")) {
    Write-Warning "URL should start with http:// or https://"
    $Url = "https://$Url"
}

Write-Host "Launching browser to: $Url"
Write-Host "Waiting [$WaitForLoadSeconds seconds] for page load and manual navigation to chats..."
Write-Host "After this wait, screenshots will be taken every [$IntervalSeconds seconds]"
Write-Host "Saving to: $OutputDirectory"
Write-Host "Press Ctrl+C to stop the script"

# Launch browser using default system browser
Start-Process $Url

# Wait for initial load and manual navigation
Start-Sleep -Seconds $WaitForLoadSeconds

# Capture initial screenshot after wait
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "${FilenamePrefix}_${timestamp}.png"
$outputPath = Join-Path $OutputDirectory $filename
Capture-Screenshot -OutputPath $outputPath -AllMonitors:$CaptureAllMonitors

Write-Host "Initial screenshot saved to: $outputPath"

# Set up continuous capture if interval specified
if ($IntervalSeconds -gt 0) {
    Write-Host "Starting continuous capture every $IntervalSeconds seconds..."

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