Add-Type -AssemblyName System.Drawing

# ---- Settings -------------------------------------------------
# Bounding box: images are scaled to fit INSIDE this (no crop, no zoom)
$targetWidth = 1600
$targetHeight = 1920

$quality = 86     # JPEG save quality (0-100)
$keepBackup = $true  # keep a _orig_<name> backup of each original
# ---------------------------------------------------------------

# Target folders (all synced)
$dirs = @(
    (Join-Path $PSScriptRoot 'images\slideshow'),
    (Join-Path $PSScriptRoot 'www\images\slideshow'),
    (Join-Path $PSScriptRoot 'android\app\src\main\assets\public\images\slideshow')
)

$sourceDir = $dirs[0]
if (!(Test-Path $sourceDir)) {
    Write-Host "Folder not found: $sourceDir" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $sourceDir -File | Where-Object {
    $_.Extension -match '^\.(jpg|jpeg|png|bmp)$' -and $_.Name -notmatch '^_'
}

if ($files.Count -eq 0) {
    Write-Host "No images found in $sourceDir" -ForegroundColor Yellow
    exit 0
}

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]$quality)

$noFlip = [System.Drawing.RotateFlipType]::RotateNoneFlipNone

$total = $files.Count
$i = 0
foreach ($f in $files) {
    $i++
    Write-Host "[$i/$total] Processing: $($f.Name)" -ForegroundColor Cyan
    try {
        $img = [System.Drawing.Image]::FromFile($f.FullName)

        # ---- EXIF orientation (phone photos) ----
        $flip = $noFlip
        if ($img.PropertyIdList -contains 274) {
            switch ($img.GetPropertyItem(274).Value[0]) {
                2 { $flip = [System.Drawing.RotateFlipType]::RotateNoneFlipX }
                3 { $flip = [System.Drawing.RotateFlipType]::Rotate180FlipNone }
                4 { $flip = [System.Drawing.RotateFlipType]::Rotate180FlipX }
                5 { $flip = [System.Drawing.RotateFlipType]::Rotate90FlipX }
                6 { $flip = [System.Drawing.RotateFlipType]::Rotate90FlipNone }
                7 { $flip = [System.Drawing.RotateFlipType]::Rotate270FlipX }
                8 { $flip = [System.Drawing.RotateFlipType]::Rotate270FlipNone }
            }
        }

        # ---- Visible (oriented) size of the image ----
        $srcW = $img.Width
        $srcH = $img.Height
        if ($flip.ToString() -match 'Rotate90|Rotate270') {
            $srcW = $img.Height
            $srcH = $img.Width
        }

        # ---- Fit inside the box: preserve ratio, no crop, no zoom ----
        # scale <= 1  =>  smaller images are never enlarged
        $scale = [Math]::Min([Math]::Min($targetWidth / $srcW, $targetHeight / $srcH), 1.0)

        if ($scale -eq 1 -and $flip -eq $noFlip -and $f.Extension -match '^\.(jpg|jpeg)$') {
            Write-Host "   skipped - already fits inside ${targetWidth}x${targetHeight}" -ForegroundColor DarkGray
            $img.Dispose()
            continue
        }

        # scale first (unrotated pixel dims), rotate/flip afterwards
        $suW = [Math]::Max(1, [int][Math]::Round($img.Width * $scale))
        $suH = [Math]::Max(1, [int][Math]::Round($img.Height * $scale))

        $bmp = New-Object System.Drawing.Bitmap($suW, $suH)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $suW, $suH)))
        $g.Dispose()
        $img.Dispose()

        if ($flip -ne $noFlip) {
            $bmp.RotateFlip($flip)
        }

        # ---- keep the original safe (first time only) ----
        if ($keepBackup) {
            $bakFull = Join-Path $sourceDir ("_orig_" + $f.Name)
            if (!(Test-Path $bakFull)) {
                Copy-Item -Path $f.FullName -Destination $bakFull -Force
            }
        }

        # ---- save via temp file, then replace (avoids "file in use") ----
        $outName = [System.IO.Path]::GetFileNameWithoutExtension($f.Name) + '.jpg'
        $outFull = Join-Path $sourceDir $outName
        $tmpFull = Join-Path $sourceDir ("_tmp_" + $outName)
        $bmp.Save($tmpFull, $encoder, $encParams)
        $savedW = $bmp.Width
        $savedH = $bmp.Height
        $bmp.Dispose()

        Move-Item -Path $tmpFull -Destination $outFull -Force

        if ($outFull -ne $f.FullName) {
            Remove-Item $f.FullName -Force
            Write-Host "   converted $($f.Extension) -> .jpg" -ForegroundColor DarkGray
        }
        Write-Host "   OK  $outName  (${savedW}x${savedH})  scale: $([Math]::Round($scale, 3))" -ForegroundColor Green
    }
    catch {
        Write-Host "   ERROR processing $($f.Name) : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ------------------------------------------------------------
#  Sync to www and android folders
#  (copy every source .jpg, remove stale copies that are gone
#   from the source folder; _orig_/_tmp_ backups are not synced)
# ------------------------------------------------------------
Write-Host ""
Write-Host "Syncing to www and android folders..." -ForegroundColor Yellow
$sourceJpgs = @(Get-ChildItem -Path $sourceDir -File |
    Where-Object { $_.Extension -eq '.jpg' -and $_.Name -notmatch '^_' })

foreach ($dir in $dirs[1..($dirs.Count - 1)]) {
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    foreach ($s in $sourceJpgs) {
        Copy-Item -Path $s.FullName -Destination (Join-Path $dir $s.Name) -Force
    }

    Get-ChildItem -Path $dir -File |
    Where-Object { $_.Extension -eq '.jpg' -and $_.Name -notmatch '^_' -and ($sourceJpgs.Name -notcontains $_.Name) } |
    ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "   removed stale: $($_.Name)" -ForegroundColor DarkGray
    }
}

Write-Host "Done! $($sourceJpgs.Count) image(s) fit inside ${targetWidth}x${targetHeight} (no crop, no zoom)." -ForegroundColor Green
Write-Host "Folders:"
foreach ($dir in $dirs) { Write-Host "   - $dir" -ForegroundColor Gray }