[CmdletBinding()]
param(
    [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = $PSScriptRoot

Write-Host '=== Fantasy full-season simulation ===' -ForegroundColor Cyan
Write-Host 'Runs against an ephemeral H2 database. Local and production data are not touched.'

Push-Location (Join-Path $workspaceRoot 'backend')
try {
    & .\gradlew.bat test --console=plain --no-daemon --rerun-tasks
    if ($LASTEXITCODE -ne 0) {
        throw "Backend tests failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

if (-not $SkipFrontend) {
    Push-Location (Join-Path $workspaceRoot 'frontend')
    try {
        & npm.cmd run lint
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend lint failed with exit code $LASTEXITCODE"
        }

        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host '=== All requested season checks passed ===' -ForegroundColor Green
