# 바로 직전 배포로 되돌리기
# DEPLOYS.md 의 두 번째 줄(직전 배포) 버전으로 Cloudflare 롤백 후, 롤백 사실을 기록
param([string]$Version)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$git = 'C:\Program Files\Git\cmd\git.exe'
$npx = 'C:\Program Files\nodejs\npx.cmd'
$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;$env:Path"
$env:CI = '1'

$log = Join-Path $root 'DEPLOYS.md'
$rows = Get-Content $log -Encoding UTF8 | Where-Object { $_ -match '^\|\s*\d{4}-' }
if (-not $Version) {
  if ($rows.Count -lt 2) { throw '되돌릴 직전 배포 기록이 없어요.' }
  $Version = ($rows[1] -split '\|')[2].Trim()
}
$current = ($rows[0] -split '\|')[2].Trim()

& $npx --yes wrangler@4 rollback $Version --message "rollback from $current" --yes
if ($LASTEXITCODE -ne 0) { throw '롤백에 실패했어요.' }

$lines = Get-Content $log -Encoding UTF8
$i = [Array]::IndexOf($lines, ($lines | Where-Object { $_ -like '|---*' } | Select-Object -First 1))
$prevRow = $rows | Where-Object { ($_ -split '\|')[2].Trim() -eq $Version } | Select-Object -First 1
$prevCommit = if ($prevRow) { ($prevRow -split '\|')[3].Trim() } else { '-' }
$row = "| $(Get-Date -Format 'yyyy-MM-dd HH:mm') | $Version | $prevCommit | ↩ 롤백 ($current → $Version) |"
$new = $lines[0..$i] + $row + $lines[($i + 1)..($lines.Count - 1)]
Set-Content $log $new -Encoding UTF8
& $git add DEPLOYS.md
& $git commit -q -m "롤백: $current -> $Version"
$remote = (& $git remote) -join ''
if ($remote) { & $git push -q origin HEAD }

Write-Host "ROLLED BACK to $Version (source commit $prevCommit)"
