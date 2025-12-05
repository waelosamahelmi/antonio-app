# Script to replace all Babylon/Ravintola references with Antonio/Pizzeria
# Run this from the antonio-admin folder

$rootPath = $PSScriptRoot
if (-not $rootPath) {
    $rootPath = Get-Location
}

Write-Host "Starting replacement in: $rootPath" -ForegroundColor Green

# File extensions to process
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.html", "*.css", "*.md", "*.sql", "*.yml", "*.yaml", "*.toml", "*.xml", "*.gradle", "*.properties")

# Folders to exclude
$excludeFolders = @("node_modules", "dist", "build", ".git", "android/build", "android/.gradle", "android/app/build")

# Get all files to process
$files = @()
foreach ($ext in $extensions) {
    $files += Get-ChildItem -Path $rootPath -Filter $ext -Recurse -File | Where-Object {
        $exclude = $false
        foreach ($folder in $excludeFolders) {
            if ($_.FullName -like "*\$folder\*") {
                $exclude = $true
                break
            }
        }
        -not $exclude
    }
}

Write-Host "Found $($files.Count) files to process" -ForegroundColor Cyan

# Order matters - more specific patterns first
$replacements = @(
    @{Old = "ravintola babylon"; New = "pizzeria antonio"}
    @{Old = "Ravintola Babylon"; New = "Pizzeria Antonio"}
    @{Old = "RAVINTOLA BABYLON"; New = "PIZZERIA ANTONIO"}
    @{Old = "ravintolababylon"; New = "pizzeriaantonio"}
    @{Old = "RavintolaBabylon"; New = "PizzeriaAntonio"}
    @{Old = "babylon-admin"; New = "antonio-admin"}
    @{Old = "babylon-app"; New = "antonio-app"}
    @{Old = "babylon-web"; New = "antonio-web"}
    @{Old = "babylon"; New = "antonio"}
    @{Old = "Babylon"; New = "Antonio"}
    @{Old = "BABYLON"; New = "ANTONIO"}
    @{Old = "ravintola"; New = "pizzeria"}
    @{Old = "Ravintola"; New = "Pizzeria"}
    @{Old = "RAVINTOLA"; New = "PIZZERIA"}
)

$totalReplacements = 0

foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $fileReplacements = 0
        
        foreach ($replacement in $replacements) {
            $oldValue = $replacement.Old
            $newValue = $replacement.New
            if ($content -match [regex]::Escape($oldValue)) {
                $content = $content -replace [regex]::Escape($oldValue), $newValue
                $fileReplacements++
            }
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $totalReplacements += $fileReplacements
            Write-Host "Updated: $($file.FullName.Replace($rootPath, '.'))" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error processing $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Completed! Total replacements: $totalReplacements" -ForegroundColor Green
Write-Host "Files processed: $($files.Count)" -ForegroundColor Green

