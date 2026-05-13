param(
    [string]$ApiBase = "https://dashboard-energie-api.onrender.com",
    [int]$PeriodSeconds = 300,
    [int]$RestartDelaySeconds = 30,
    [switch]$SkipCsv
)

$ErrorActionPreference = 'Stop'
$ApiBase = ($ApiBase | ForEach-Object { "$_" }).Trim()

function Resolve-PythonCommand {
    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($launcher) {
        return @{
            Executable = $launcher.Source
            Arguments = @('-3')
        }
    }

    $python = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($python) {
        return @{
            Executable = $python.Source
            Arguments = @()
        }
    }

    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        return @{
            Executable = $python.Source
            Arguments = @()
        }
    }

    throw "Python introuvable. Installez Python 3 puis relancez l'installation de la tâche planifiée."
}

function Write-ServiceLog {
    param([string]$Message)

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "$timestamp | $Message"
    Write-Output $line
    Add-Content -LiteralPath $script:LogPath -Value $line
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$agentScript = Join-Path $PSScriptRoot 'pac_agent.py'
$logDir = Join-Path $repoRoot 'data\logs'
$null = New-Item -ItemType Directory -Path $logDir -Force
$script:LogPath = Join-Path $logDir 'pac_agent_service.log'

$mutexName = 'Local\ITALCAR_PAC_AGENT_SERVICE'
$createdNew = $false
$mutex = $null

try {
    $mutex = New-Object System.Threading.Mutex($true, $mutexName, [ref]$createdNew)
    if (-not $createdNew) {
        Write-ServiceLog "Une instance du service PAC tourne déjà. Arrêt du doublon."
        exit 0
    }
}
catch {
    Write-ServiceLog "Mutex non disponible ($mutexName): $($_.Exception.Message). Le service continue sans verrou global."
}

try {
    $pythonCommand = Resolve-PythonCommand
    $agentArgs = @($pythonCommand.Arguments + @(
        $agentScript,
        '--api-base', $ApiBase,
        '--period', $PeriodSeconds.ToString()
    ))

    if ($SkipCsv) {
        $agentArgs += '--skip-csv'
    }

    Write-ServiceLog "Service PAC démarré. API=$ApiBase | période=${PeriodSeconds}s"
    Write-ServiceLog "Interpréteur Python: $($pythonCommand.Executable) $($pythonCommand.Arguments -join ' ')"

    while ($true) {
        try {
            Write-ServiceLog "Lancement de pac_agent.py"
            & $pythonCommand.Executable @agentArgs
            $exitCode = $LASTEXITCODE
            Write-ServiceLog "pac_agent.py s'est arrêté avec le code $exitCode. Redémarrage dans ${RestartDelaySeconds}s."
        }
        catch {
            Write-ServiceLog "Erreur du service PAC: $($_.Exception.Message). Redémarrage dans ${RestartDelaySeconds}s."
        }

        Start-Sleep -Seconds $RestartDelaySeconds
    }
}
finally {
    if ($mutex) {
        try {
            $mutex.ReleaseMutex() | Out-Null
        }
        catch {
        }
        $mutex.Dispose()
    }
}
