# Generate VERY DISTINCT Kravv UI sounds — 7 clearly different WAV files
# Run: powershell -ExecutionPolicy Bypass -File scripts/generate_all_sounds.ps1

function New-WavFile {
    param([string]$Path, [int]$DurationMs, [scriptblock]$Sample, [int]$SR = 22050)

    $n  = [int]($SR * $DurationMs / 1000)
    $ds = $n * 2
    $rs = 36 + $ds
    $buf = [byte[]]::new(44 + $ds)

    [Text.Encoding]::ASCII.GetBytes("RIFF").CopyTo($buf, 0)
    $buf[4]=$rs-band 0xFF; $buf[5]=($rs-shr 8)-band 0xFF
    $buf[6]=($rs-shr 16)-band 0xFF; $buf[7]=($rs-shr 24)-band 0xFF
    [Text.Encoding]::ASCII.GetBytes("WAVE").CopyTo($buf, 8)
    [Text.Encoding]::ASCII.GetBytes("fmt ").CopyTo($buf, 12)
    $buf[16]=16; $buf[20]=1; $buf[22]=1
    $buf[24]=$SR-band 0xFF; $buf[25]=($SR-shr 8)-band 0xFF
    $br = $SR * 2
    $buf[28]=$br-band 0xFF; $buf[29]=($br-shr 8)-band 0xFF
    $buf[32]=2; $buf[34]=16
    [Text.Encoding]::ASCII.GetBytes("data").CopyTo($buf, 36)
    $buf[40]=$ds-band 0xFF; $buf[41]=($ds-shr 8)-band 0xFF

    for ($i = 0; $i -lt $n; $i++) {
        $v = [int]($Sample.Invoke($i, $n, $SR)[0])
        $v = [Math]::Max(-32768, [Math]::Min(32767, $v))
        $u = if ($v -lt 0) { $v + 65536 } else { $v }
        $buf[44 + $i*2]     = [byte]($u -band 0xFF)
        $buf[45 + $i*2] = [byte](($u -shr 8) -band 0xFF)
    }

    [IO.File]::WriteAllBytes($Path, $buf)
    Write-Host "  OK $([IO.Path]::GetFileName($Path))  ($($buf.Length) bytes, ${DurationMs}ms)"
}

$d = "c:\Users\RentoBees\Desktop\kravv\assets\sounds"
New-Item -ItemType Directory -Force -Path $d | Out-Null
Write-Host ""
Write-Host "Generating DISTINCT Kravv UI sounds..."
Write-Host ""

# ──────────────────────────────────────────────────────────────────────
# 1. click.wav — SINGLE BEEP, 1000 Hz, 50 ms  [generic button tap]
# ──────────────────────────────────────────────────────────────────────
New-WavFile "$d\click.wav" 50 {
    param($i,$n,$sr)
    $t = $i / $sr
    [Math]::Round(32767 * 0.80 * [Math]::Sin(2*[Math]::PI*1000*$t) * [Math]::Exp(-70*$t))
}

# ──────────────────────────────────────────────────────────────────────
# 2. add.wav — RISING TWO-TONE: 800 Hz then 1400 Hz (100ms each) [item added]
# ──────────────────────────────────────────────────────────────────────
New-WavFile "$d\add.wav" 200 {
    param($i,$n,$sr)
    $t  = $i / $sr
    if ($t -le 0.10) {
        # First beep: 800 Hz
        [Math]::Round(32767 * 0.80 * [Math]::Sin(2*[Math]::PI*800*$t) * [Math]::Exp(-40*$t))
    } elseif ($t -ge 0.12) {
        # Second beep: 1400 Hz (higher pitch = "added!")
        $t2 = $t - 0.12
        [Math]::Round(32767 * 0.80 * [Math]::Sin(2*[Math]::PI*1400*$t2) * [Math]::Exp(-40*$t2))
    } else { 0 }
}

# ──────────────────────────────────────────────────────────────────────
# 3. remove.wav — SINGLE SOFT LOW BEEP, 500 Hz, 60 ms [qty decreased]
# ──────────────────────────────────────────────────────────────────────
New-WavFile "$d\remove.wav" 60 {
    param($i,$n,$sr)
    $t = $i / $sr
    [Math]::Round(32767 * 0.55 * [Math]::Sin(2*[Math]::PI*500*$t) * [Math]::Exp(-60*$t))
}

# ──────────────────────────────────────────────────────────────────────
# 4. delete.wav — FALLING TWO-TONE: 900 Hz then 400 Hz (80ms each) [item deleted]
# ──────────────────────────────────────────────────────────────────────
New-WavFile "$d\delete.wav" 180 {
    param($i,$n,$sr)
    $t = $i / $sr
    if ($t -le 0.08) {
        # First beep: 900 Hz
        [Math]::Round(32767 * 0.78 * [Math]::Sin(2*[Math]::PI*900*$t) * [Math]::Exp(-45*$t))
    } elseif ($t -ge 0.10) {
        # Second beep: 400 Hz (lower pitch = "removed/gone")
        $t2 = $t - 0.10
        [Math]::Round(32767 * 0.78 * [Math]::Sin(2*[Math]::PI*400*$t2) * [Math]::Exp(-45*$t2))
    } else { 0 }
}

# ──────────────────────────────────────────────────────────────────────
# 5. hold.wav — TRIPLE BEEP at 650 Hz (3 short bursts) [order held]
# ──────────────────────────────────────────────────────────────────────
New-WavFile "$d\hold.wav" 380 {
    param($i,$n,$sr)
    $t = $i / $sr
    $hz = 650
    $decay = 50
    if ($t -le 0.07) {
        $t2 = $t
        [Math]::Round(32767 * 0.70 * [Math]::Sin(2*[Math]::PI*$hz*$t2) * [Math]::Exp(-$decay*$t2))
    } elseif ($t -ge 0.11 -and $t -le 0.18) {
        $t2 = $t - 0.11
        [Math]::Round(32767 * 0.70 * [Math]::Sin(2*[Math]::PI*$hz*$t2) * [Math]::Exp(-$decay*$t2))
    } elseif ($t -ge 0.22 -and $t -le 0.29) {
        $t2 = $t - 0.22
        [Math]::Round(32767 * 0.70 * [Math]::Sin(2*[Math]::PI*$hz*$t2) * [Math]::Exp(-$decay*$t2))
    } else { 0 }
}

# ──────────────────────────────────────────────────────────────────────
# 6. print.wav — SINGLE LONG LOW BEEP, 300 Hz, 300 ms [bill printed]
# ──────────────────────────────────────────────────────────────────────
New-WavFile "$d\print.wav" 300 {
    param($i,$n,$sr)
    $t = $i / $sr
    [Math]::Round(32767 * 0.75 * [Math]::Sin(2*[Math]::PI*300*$t) * [Math]::Exp(-15*$t))
}

# ──────────────────────────────────────────────────────────────────────
# 7. success.wav — THREE ASCENDING TONES: 600→900→1300 Hz (80ms each) [printer connected]
# ──────────────────────────────────────────────────────────────────────
New-WavFile "$d\success.wav" 320 {
    param($i,$n,$sr)
    $t = $i / $sr
    if ($t -le 0.08) {
        [Math]::Round(32767 * 0.72 * [Math]::Sin(2*[Math]::PI*600*$t) * [Math]::Exp(-35*$t))
    } elseif ($t -ge 0.10 -and $t -le 0.18) {
        $t2 = $t - 0.10
        [Math]::Round(32767 * 0.72 * [Math]::Sin(2*[Math]::PI*900*$t2) * [Math]::Exp(-35*$t2))
    } elseif ($t -ge 0.20) {
        $t2 = $t - 0.20
        [Math]::Round(32767 * 0.72 * [Math]::Sin(2*[Math]::PI*1300*$t2) * [Math]::Exp(-35*$t2))
    } else { 0 }
}

Write-Host ""
Write-Host "Done! 7 distinct sounds ready:"
Write-Host "  click   = single beep (1000 Hz, 50ms)"
Write-Host "  add     = RISING double-beep (800+1400 Hz)"
Write-Host "  remove  = soft low beep (500 Hz, 60ms)"
Write-Host "  delete  = FALLING double-beep (900+400 Hz)"
Write-Host "  hold    = TRIPLE beep (650 Hz x3)"
Write-Host "  print   = long LOW beep (300 Hz, 300ms)"
Write-Host "  success = THREE ascending tones (600+900+1300 Hz)"
Write-Host ""
