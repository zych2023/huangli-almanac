<# Generate round 4 icon variants - more Chinese fonts #>
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Split-Path $PSScriptRoot) 'icon-variants'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$bg = [System.Drawing.Color]::FromArgb(255, 158, 58, 50)
$fg = [System.Drawing.Color]::White
$size = 512
$char = [char]0x5B9C  # yi
$B = [System.Drawing.FontStyle]::Bold
$R = [System.Drawing.FontStyle]::Regular

function Gen($fontFamily, $outName, $label, $fontSize, $style) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear($bg)

  $font = $null
  try { $font = New-Object System.Drawing.Font($fontFamily, $fontSize, $style, [System.Drawing.GraphicsUnit]::Pixel) }
  catch { }
  if (-not $font) {
    try { $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel) }
    catch { $font = New-Object System.Drawing.Font('Georgia', $fontSize, [System.Drawing.GraphicsUnit]::Pixel) }
  }

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
  $brush = New-Object System.Drawing.SolidBrush($fg)
  $g.DrawString($char, $font, $brush, $rect, $sf)

  $path = Join-Path $outDir $outName
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $brush.Dispose(); $font.Dispose()
  Write-Host "OK: $outName  [$label]"
}

Write-Host "=== Round 4: More Chinese fonts ==="

Gen '华文行楷'    '24-hwxingkai.png'   'HuaWen XingKai'   300 $R
Gen '华文楷体'    '25-hwkaiti.png'      'HuaWen KaiTi'     300 $R
Gen '华文隶书'    '26-hwlishu.png'      'HuaWen LiShu'     300 $R
Gen '华文新魏'    '27-hwxinwei.png'     'HuaWen XinWei'    300 $R
Gen '华文中宋'    '28-hwzhongsong.png'  'HuaWen ZhongSong' 280 $B
Gen '华文细黑'    '29-hwxihei.png'      'HuaWen XiHei'     300 $B
Gen '华文彩云'    '30-hwcaiyun.png'     'HuaWen CaiYun'    280 $R
Gen '华文琥珀'    '31-hwhupo.png'       'HuaWen HuPo'      280 $R
Gen '方正舒体'    '32-fzshuti.png'      'FangZheng ShuTi'  300 $R
Gen '方正姚体'    '33-fzyaoti.png'      'FangZheng YaoTi'  300 $R
Gen '幼圆'        '34-youyuan.png'      'YouYuan'          280 $B
Gen '等线'        '35-dengxian.png'     'DengXian'         300 $B
Gen '隶书'        '36-lishu.png'        'LiShu'            300 $R
Gen '华文宋体'    '37-hwsongti.png'     'HuaWen SongTi'    300 $R

# Noto Sans SC weight variants
Gen 'Noto Sans SC Black'   '38-notosans-black.png'   'NotoSans Black'   280 $B
Gen 'Noto Sans SC Medium'  '39-notosans-medium.png'  'NotoSans Medium'  280 $R
Gen 'Noto Sans SC Thin'    '40-notosans-thin.png'    'NotoSans Thin'    300 $R

# Noto Serif SC weight variants
Gen 'Noto Serif SC Black'   '41-notoserif-black.png'  'NotoSerif Black'  280 $B
Gen 'Noto Serif SC Medium'  '42-notoserif-medium.png' 'NotoSerif Medium' 280 $R
Gen 'Noto Serif SC SemiBold' '43-notoserif-semibold.png' 'NotoSerif SemiBold' 280 $B

Write-Host ""
Write-Host "Done! $outDir"
