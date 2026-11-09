# 홈페이지 배포 ("푸시")
# 1) 변경사항을 git에 커밋  2) Cloudflare에 배포  3) DEPLOYS.md에 버전 기록  4) 원격 저장소가 있으면 git push
param([string]$Message = "사이트 업데이트")

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$git = 'C:\Program Files\Git\cmd\git.exe'
$npx = 'C:\Program Files\nodejs\npx.cmd'
$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;$env:Path"
$env:CI = '1'

# 1) 소스 커밋
& $git add -A
& $git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { & $git commit -q -m $Message }
$commit = (& $git rev-parse --short HEAD).Trim()

# 2) 배포 (커밋 해시를 배포 메시지로 남김)
$out = & $npx --yes wrangler@4 deploy --message "$commit $Message" 2>&1 | Out-String
Write-Host $out
$m = [regex]::Match($out, 'Current Version ID:\s*([0-9a-f-]{36})')
if (-not $m.Success) { throw '배포 버전 ID를 찾지 못했어요. 배포가 실패했을 수 있어요.' }
$version = $m.Groups[1].Value

# 3) 배포 기록 (맨 위가 최신)
$log = Join-Path $root 'DEPLOYS.md'
$lines = Get-Content $log -Encoding UTF8
$row = "| $(Get-Date -Format 'yyyy-MM-dd HH:mm') | $version | $commit | $Message |"
$i = [Array]::IndexOf($lines, ($lines | Where-Object { $_ -like '|---*' } | Select-Object -First 1))
$new = $lines[0..$i] + $row + $lines[($i + 1)..($lines.Count - 1)]
Set-Content $log $new -Encoding UTF8
& $git add DEPLOYS.md
& $git commit -q -m "배포 기록: $version"

# 4) 원격 저장소로 push
$remote = (& $git remote) -join ''
if ($remote) { & $git push -q origin HEAD } else { Write-Host '원격 저장소가 아직 없어서 push는 건너뛰었어요.' }

Write-Host "DEPLOYED $version (commit $commit)"
