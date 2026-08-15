[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$ResourceId,

    [datetime]$Start = (Get-Date).AddDays(-1),

    [datetime]$End = (Get-Date),

    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

if ($End -le $Start) {
    throw 'End must be later than Start.'
}

$renderCommand = Get-Command render -ErrorAction Stop

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $OutputPath = Join-Path 'exports' "render-logs-$stamp.json"
}

$outputDirectory = Split-Path -Parent $OutputPath
if (-not [string]::IsNullOrWhiteSpace($outputDirectory)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

$startUtc = $Start.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$endUtc = $End.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

$logOutput = & $renderCommand.Source logs `
    --resources $ResourceId `
    --start $startUtc `
    --end $endUtc `
    --direction forward `
    --limit 10000 `
    --output json

if ($LASTEXITCODE -ne 0) {
    throw "Render CLI failed with exit code $LASTEXITCODE."
}

$logOutput | Set-Content -LiteralPath $OutputPath -Encoding utf8
Write-Host "Render logs exported to $OutputPath"
