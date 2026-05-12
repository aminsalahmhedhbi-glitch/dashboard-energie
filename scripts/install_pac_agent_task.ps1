param(
    [string]$TaskName = "ITALCAR PAC Agent",
    [string]$ApiBase = "https://dashboard-energie-api.onrender.com",
    [int]$PeriodSeconds = 300,
    [switch]$SkipCsv
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runnerScript = Join-Path $PSScriptRoot 'run_pac_agent_service.ps1'

if (-not (Test-Path -LiteralPath $runnerScript)) {
    throw "Script introuvable: $runnerScript"
}

$quotedRunner = '"' + $runnerScript + '"'
$arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', $quotedRunner,
    '-ApiBase', '"' + $ApiBase + '"',
    '-PeriodSeconds', $PeriodSeconds.ToString()
)

if ($SkipCsv) {
    $arguments += '-SkipCsv'
}

$action = New-ScheduledTaskAction `
    -Execute "$PSHOME\powershell.exe" `
    -Argument ($arguments -join ' ') `
    -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Days 3650) `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1)

$task = New-ScheduledTask -Action $action -Principal $principal -Settings $settings -Trigger $trigger
Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host "Tâche planifiée '$TaskName' installée et démarrée."
Write-Host "Script lancé au boot: $runnerScript"
Write-Host "API cible: $ApiBase"
Write-Host "Période agent: ${PeriodSeconds}s"
