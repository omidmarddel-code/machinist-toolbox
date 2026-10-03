# ============================================================================
#  Machinist Toolbox - restore Android-only files (games + AI assistant)
#  ---------------------------------------------------------------------------
#  Why: `npx cap sync android` (npm run sync) overwrites
#       android/app/src/main/assets/public with the contents of www/.
#       Only the latest mobile.js / mobile.css (with the AI clear-chat key
#       under the search magnifier) are kept as master in www/, so they are
#       copied back from android/game-backup/ after every sync.
#       The Android-only files are mobile-game.js / mobile-game.css (games)
#       and mobile-ai.js / mobile-ai.css (AI assistant); their four lines
#       inside assets/public/index.html are lost by that sync.
#
#  What: copies the master files from www/ (the single source of truth, the same
#       folder Capacitor syncs from) into android/app/src/main/assets/public/ and
#       mirrors them back into android/game-backup/, then makes sure index.html
#       references the Android-only files. Safe to run many times (idempotent).
#
#  IMPORTANT (regression guard): mobile-ai.js used to drift badly — game-backup
#  was 600+ lines behind, and because this script copied FROM game-backup, every
#  `npm run sync` silently rolled the AI assistant back to the old version and
#  threw away the troubleshooting knowledge base, the smart matching and all bug
#  fixes. www/ is now the only master, so the three copies always match.
#  The drift check at the end fails loudly instead of shipping a stale build.
#
#  Usage: powershell -ExecutionPolicy Bypass -File android\restore-game-after-sync.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

$root    = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$master  = Join-Path $root 'www'
$android = Split-Path -Parent $MyInvocation.MyCommand.Path
$backup  = Join-Path $android 'game-backup'
$assets  = Join-Path $android 'app\src\main\assets\public'
$index   = Join-Path $assets 'index.html'

# فایل‌هایی که فقط مخصوص اندروید هستند و داخل www/ نگه‌داری می‌شوند
$androidOnly = @('mobile.js', 'mobile.css', 'mobile-game.js', 'mobile-game.css', 'mobile-ai.js', 'mobile-ai.css')

Write-Host '== restore Android-only files: games + AI assistant =='
if (-not (Test-Path -LiteralPath $assets)) { throw "assets folder not found: $assets" }
if (-not (Test-Path -LiteralPath $master)) { throw "www folder not found: $master" }
if (-not (Test-Path -LiteralPath $backup)) { New-Item -ItemType Directory -Path $backup -Force | Out-Null }

foreach ($f in $androidOnly) {
  $src = Join-Path $master $f
  if (-not (Test-Path -LiteralPath $src)) { throw "missing master file: $src" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $assets $f) -Force
  Copy-Item -LiteralPath $src -Destination (Join-Path $backup $f) -Force   # آینهٔ master
  Write-Host "  synced  $f"
}

# موتور OCR محلی (Tesseract.js) هم باید داخل بستهٔ اندروید باشد تا خواندن
# متن نقشه بدون اینترنت و بدون CDN انجام شود.
$tessBackup = Join-Path $backup 'vendor\tesseract'
$tessAssets = Join-Path $assets 'vendor\tesseract'
if (Test-Path -LiteralPath $tessBackup) {
  if (-not (Test-Path -LiteralPath $tessAssets)) { New-Item -ItemType Directory -Path $tessAssets -Force | Out-Null }
  Copy-Item -Path (Join-Path $tessBackup '*') -Destination $tessAssets -Recurse -Force
  Write-Host "  copied  vendor/tesseract/"
}


if (-not (Test-Path -LiteralPath $index)) { throw "index.html not found: $index" }
$html = Get-Content -LiteralPath $index -Raw -Encoding UTF8
$changed = $false

if ($html -notmatch 'mobile-game\.css') {
  $add = "`r`n  " + '<link rel="stylesheet" href="mobile-game.css" />'
  $html = $html -replace '(<link rel="stylesheet" href="mobile\.css"([^"]*)?" />)', ('$1' + $add)
  $changed = $true
}
if ($html -notmatch 'mobile-game\.js') {
  $add = "`r`n  " + '<script src="mobile-game.js" defer></script>'
  $html = $html -replace '(<script src="mobile\.js"([^"]*)?" defer></script>)', ('$1' + $add)
  $changed = $true
}

if ($html -notmatch 'mobile-ai\.css') {
  $add = "`r`n  " + '<link rel="stylesheet" href="mobile-ai.css" />'
  $html = $html -replace '(<link rel="stylesheet" href="mobile-game\.css" />)', ('$1' + $add)
  $changed = $true
}
if ($html -notmatch 'mobile-ai\.js') {
  $add = "`r`n  " + '<script src="mobile-ai.js" defer></script>'
  $html = $html -replace '(<script src="mobile-game\.js" defer></script>)', ('$1' + $add)
  $changed = $true
}

if ($changed) {
  [System.IO.File]::WriteAllText($index, $html, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host '  patched assets/public/index.html'
} else {
  Write-Host '  index.html already references the Android-only files'
}

# --- گارد واگرایی: هر سه نسخه باید دقیقاً یکی باشند -------------------
# اگر کسی فقط یکی از نسخه‌ها را دستی ویرایش کند، اینجا با خطای واضح متوقف
# می‌شویم تا نسخهٔ قدیمی‌تر بی‌سروصدا وارد بستهٔ اندروید نشود.
$drift = @()
foreach ($f in $androidOnly) {
  $a = (Get-FileHash -LiteralPath (Join-Path $master $f)).Hash
  $b = (Get-FileHash -LiteralPath (Join-Path $assets $f)).Hash
  $c = (Get-FileHash -LiteralPath (Join-Path $backup $f)).Hash
  if ($a -ne $b -or $a -ne $c) { $drift += $f }
}
if ($drift.Count -gt 0) {
  throw ("version drift detected in: " + ($drift -join ', ') + " - www/ is the master; re-run this script.")
}
Write-Host '  drift check: all copies match www/ (master)'

Write-Host '== done: rebuild the APK in Android Studio =='
