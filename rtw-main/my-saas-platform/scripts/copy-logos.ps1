# Script to copy government logos from Downloads to public/assets
# Run this script from the project root

$downloadsPath = "$env:USERPROFILE\Downloads"
$assetsPath = "public\assets"

# Create assets directory if it doesn't exist
if (-not (Test-Path $assetsPath)) {
    New-Item -ItemType Directory -Path $assetsPath -Force
}

# Copy files based on partial filename matching
Get-ChildItem -Path $downloadsPath -Filter "*.svg" | ForEach-Object {
    $fileName = $_.Name
    
    if ($fileName -match "الإعلام") {
        Copy-Item $_.FullName -Destination "$assetsPath\logo-media-authority.svg" -Force
        Write-Host "Copied: logo-media-authority.svg"
    }
    elseif ($fileName -match "2030") {
        Copy-Item $_.FullName -Destination "$assetsPath\logo-vision-2030.svg" -Force
        Write-Host "Copied: logo-vision-2030.svg"
    }
    elseif ($fileName -match "الأعمال") {
        Copy-Item $_.FullName -Destination "$assetsPath\logo-saudi-business-center.svg" -Force
        Write-Host "Copied: logo-saudi-business-center.svg"
    }
    elseif ($fileName -match "التجارة") {
        Copy-Item $_.FullName -Destination "$assetsPath\logo-commerce-ministry.svg" -Force
        Write-Host "Copied: logo-commerce-ministry.svg"
    }
}

Write-Host "`nLogo copying complete!"
