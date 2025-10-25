# Fix Windows Firewall for Node.js to connect to Supabase
# This script must be run as Administrator

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Node.js Firewall Fix for Supabase" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Navigate to this directory and run the script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Find Node.js installation
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
    "$env:ProgramFiles\nodejs\node.exe"
)

$nodeExe = $null
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeExe = $path
        break
    }
}

if (-not $nodeExe) {
    # Try to find node in PATH
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $nodeExe = $nodeCommand.Source
    } else {
        Write-Host "ERROR: Could not find Node.js installation!" -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "✓ Found Node.js at: $nodeExe" -ForegroundColor Green
Write-Host ""

# Remove existing rules (if any)
Write-Host "Removing existing Node.js firewall rules..." -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "Node.js - Outbound" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Get-NetFirewallRule -DisplayName "Node.js - Inbound" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Write-Host "✓ Cleaned up existing rules" -ForegroundColor Green
Write-Host ""

# Create new firewall rules
Write-Host "Creating firewall rules for Node.js..." -ForegroundColor Yellow

try {
    # Outbound rule (required for Supabase connection)
    New-NetFirewallRule `
        -DisplayName "Node.js - Outbound" `
        -Direction Outbound `
        -Program $nodeExe `
        -Action Allow `
        -Protocol TCP `
        -RemotePort 443,80 `
        -Profile Any `
        -Description "Allow Node.js to make HTTPS/HTTP connections (required for Supabase)"

    Write-Host "✓ Created outbound rule (HTTPS/HTTP)" -ForegroundColor Green

    # Inbound rule (for local development server)
    New-NetFirewallRule `
        -DisplayName "Node.js - Inbound" `
        -Direction Inbound `
        -Program $nodeExe `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 5000,5173 `
        -Profile Private,Domain `
        -Description "Allow Node.js development servers (ports 5000, 5173)"

    Write-Host "✓ Created inbound rule (dev servers)" -ForegroundColor Green
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "SUCCESS! Firewall configured" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Cyan
    Write-Host "1. Restart your terminals" -ForegroundColor White
    Write-Host "2. Run 'npm run dev' and 'npm run dev:server'" -ForegroundColor White
    Write-Host "3. Node.js should now connect to Supabase" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host "ERROR: Failed to create firewall rules!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative solution:" -ForegroundColor Yellow
    Write-Host "1. Open Windows Security" -ForegroundColor White
    Write-Host "2. Go to Firewall & network protection" -ForegroundColor White
    Write-Host "3. Click 'Allow an app through firewall'" -ForegroundColor White
    Write-Host "4. Click 'Change settings'" -ForegroundColor White
    Write-Host "5. Find Node.js or add it manually" -ForegroundColor White
    Write-Host "6. Check both Private and Public boxes" -ForegroundColor White
    exit 1
}

Read-Host "Press Enter to exit"
