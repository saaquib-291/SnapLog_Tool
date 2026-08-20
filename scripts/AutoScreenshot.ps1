# Screenshot Capture Script
param(
    [int]$IntervalSeconds = 3,
    [string]$OutputDirectory = "$HOME\Pictures\Screenshots\AutoCapture",
    [string]$FilenamePrefix = "auto_screenshot",
    [switch]$CaptureAllMonitors
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

# Capture initial screenshot
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