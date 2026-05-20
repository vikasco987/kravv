# Generate a short crisp click WAV sound for Kravv app
# Run: powershell -ExecutionPolicy Bypass -File scripts/generate_click_sound.ps1

$sampleRate = 22050
$numSamples = 992      # ~45ms at 22050 Hz
$dataSize   = $numSamples * 2   # 16-bit mono = 2 bytes per sample
$riffSize   = 36 + $dataSize    # Total RIFF chunk size (file size - 8)

# ---- WAV Header (44 bytes) ----
function To-LE4([int]$v) { [byte]($v -band 0xFF), [byte](($v -shr 8) -band 0xFF), [byte](($v -shr 16) -band 0xFF), [byte](($v -shr 24) -band 0xFF) }
function To-LE2([int]$v) { [byte]($v -band 0xFF), [byte](($v -shr 8) -band 0xFF) }

$header  = [byte[]]@(0x52,0x49,0x46,0x46)   # "RIFF"
$header += To-LE4 $riffSize
$header += [byte[]]@(0x57,0x41,0x56,0x45)   # "WAVE"
$header += [byte[]]@(0x66,0x6D,0x74,0x20)   # "fmt "
$header += To-LE4 16                         # fmt chunk size
$header += To-LE2 1                          # PCM format
$header += To-LE2 1                          # Mono
$header += To-LE4 $sampleRate
$header += To-LE4 ($sampleRate * 2)          # Byte rate (SR * channels * bits/8)
$header += To-LE2 2                          # Block align
$header += To-LE2 16                         # Bits per sample
$header += [byte[]]@(0x64,0x61,0x74,0x61)   # "data"
$header += To-LE4 $dataSize

# ---- PCM Data: 900 Hz sine wave with fast exponential decay ----
$pcm = [byte[]]::new($dataSize)
for ($i = 0; $i -lt $numSamples; $i++) {
    $t     = $i / $sampleRate
    $decay = [Math]::Exp(-$t * 80)
    $val   = [int]([Math]::Round(32767 * 0.80 * [Math]::Sin(2 * [Math]::PI * 900 * $t) * $decay))
    if ($val -gt  32767) { $val =  32767 }
    if ($val -lt -32768) { $val = -32768 }

    # Little-endian signed 16-bit
    $unsigned = if ($val -lt 0) { $val + 65536 } else { $val }
    $pcm[$i * 2]     = [byte]($unsigned -band 0xFF)
    $pcm[$i * 2 + 1] = [byte](($unsigned -shr 8) -band 0xFF)
}

# ---- Write file ----
$outDir  = "c:\Users\RentoBees\Desktop\kravv\assets\sounds"
$outFile = "$outDir\click.wav"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
[System.IO.File]::WriteAllBytes($outFile, $header + $pcm)

Write-Host "✅ Click sound created: $outFile"
Write-Host "   Size: $(($header + $pcm).Length) bytes | Duration: ~45ms | 22050 Hz / 16-bit mono"
