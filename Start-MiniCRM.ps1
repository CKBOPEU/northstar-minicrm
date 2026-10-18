$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:NEXT_TELEMETRY_DISABLED='1'
if(-not(Test-Path 'node_modules/next/dist/bin/next')){throw 'Install dependencies first: pnpm install --frozen-lockfile'}
Write-Host 'Northstar MiniCRM: http://127.0.0.1:3102 (Ctrl+C to stop)'
& node 'node_modules/next/dist/bin/next' dev --hostname 127.0.0.1 --port 3102
