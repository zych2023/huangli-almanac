<# Generate app icon variants with different fonts #>
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Split-Path $PSScriptRoot) 'icon-variants'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$bgRed = 158; $bgGreen = 58; $bgBlue = 50
$size = 512
$char = [char]0x5B9C  # U+5B9C = yi/auspicious

function New-Icon($fontFamily, $outName, $label) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $bg = [System.Drawing.Color]::FromArgb(255, $bgRed, $bgGreen, $bgBlue)
  $g.Clear($bg)

  $fontSize = 300
  try {
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  } catch {
    $font = New-Object System.Drawing.Font('Georgia', $fontSize, [System.Drawing.GraphicsUnit]::Pixel)
  }

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.DrawString($char, $font, $brush, $rect, $sf)

  $path = Join-Path $outDir $outName
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $brush.Dispose(); $font.Dispose()
  Write-Host "OK: $outName  [$label]"
}

Write-Host "Generating icon variants (char=yi, size=512x512, red bg)..."
Write-Host ""

New-Icon 'Georgia'                '01-georgia.png'        'Georgia (current)'
New-Icon 'SimSun'                 '02-simsun.png'         'SimSun / Song Ti'
New-Icon 'KaiTi'                  '03-kaiti.png'          'KaiTi / Kai Ti'
New-Icon 'Microsoft YaHei'       '04-yahei.png'          'Microsoft YaHei'
New-Icon 'SimHei'                '05-simhei.png'         'SimHei / Hei Ti'
New-Icon 'FangSong'              '06-fangsong.png'       'FangSong / Fang Song'
New-Icon 'Noto Serif SC'         '07-noto-serif.png'     'Noto Serif SC'
New-Icon 'Noto Sans SC'          '08-noto-sans.png'      'Noto Sans SC'

Write-Host ""
Write-Host "All generated to: $outDir"
