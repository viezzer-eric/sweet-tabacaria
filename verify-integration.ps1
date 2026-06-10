$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0

function Test-Step {
  param($Name, $ScriptBlock)
  try {
    & $ScriptBlock
    Write-Host "  [PASS] $Name" -ForegroundColor Green
    $script:passed++
  } catch {
    Write-Host "  [FAIL] $Name" -ForegroundColor Red
    Write-Host "         $($_.Exception.Message)" -ForegroundColor DarkRed
    $script:failed++
  }
}

# Backend
Write-Host "`n--- Backend ---" -ForegroundColor Cyan
Push-Location C:\Repositorios\capivara-smoke-api
Test-Step "dotnet restore" { dotnet restore *>&1 | Out-Null }
Test-Step "dotnet build" { dotnet build *>&1 | Out-Null }
Test-Step "Projetos" {
  @("Domain","Application","Infrastructure","API") | ForEach-Object {
    if (-not (Test-Path "CapivaraSmoke.$_\CapivaraSmoke.$_.csproj")) { throw "Projeto CapivaraSmoke.$_ nao encontrado" }
  }
}
Test-Step "Controllers" {
  @("Auth","Addresses","Orders","Admin","Setup") | ForEach-Object {
    if (-not (Test-Path "CapivaraSmoke.API\Controllers\${_}Controller.cs")) { throw "Controller ${_} nao encontrado" }
  }
}
Pop-Location

# Frontend
Write-Host "`n--- Frontend ---" -ForegroundColor Cyan
Push-Location C:\Repositorios\sweet-tabacaria

Test-Step "build" {
  $b = npm run build 2>&1 | Out-String
  if ($b -match "error" -or $b -match "Error") { throw "build falhou" }
}

Test-Step "rotas" {
  $app = Get-Content src\App.jsx -Raw
  @("/login","/conta","/checkout","/admin","/admin/setup") | ForEach-Object {
    if ($app -notmatch [regex]::Escape($_)) { throw "rota $_ nao encontrada" }
  }
}

Test-Step "API client usage" {
  $auth = Get-Content src\context\AuthContext.jsx -Raw
  if ($auth -notmatch "client\.") { throw "AuthContext nao usa client.js" }
  $checkout = Get-Content src\pages\CheckoutPage.jsx -Raw
  if ($checkout -notmatch "client") { throw "CheckoutPage nao usa client" }
}

Test-Step "sem supabase.js imports" {
  $files = Get-ChildItem -Recurse -Include "*.jsx","*.js" -Path src | Where-Object { $_.Name -ne "supabase.js" }
  $bad = @()
  foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    if ($c -match "from.*supabase" -or $c -match "import.*supabase") { $bad += $f.FullName }
  }
  if ($bad.Count -gt 0) { throw "ainda usam supabase: $($bad -join ', ')" }
}

Pop-Location

# API smoke tests (optional)
Write-Host "`n--- API Smoke Tests ---" -ForegroundColor Cyan
try {
  $health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -UseBasicParsing
  if ($health.StatusCode -eq 200) {
    Write-Host "  API is running" -ForegroundColor Green
    Test-Step "GET /api/products" { $r = Invoke-WebRequest "http://localhost:5000/api/products" -UseBasicParsing; if ($r.StatusCode -ne 200) { throw "status $($r.StatusCode)" } }
    Test-Step "GET /api/categories" { $r = Invoke-WebRequest "http://localhost:5000/api/categories" -UseBasicParsing; if ($r.StatusCode -ne 200) { throw "status $($r.StatusCode)" } }
    Test-Step "GET /api/setup/check" { $r = Invoke-WebRequest "http://localhost:5000/api/setup/check" -UseBasicParsing; if ($r.StatusCode -ne 200) { throw "status $($r.StatusCode)" } }
    Test-Step "POST /api/admin/products (401)" { try { Invoke-WebRequest "http://localhost:5000/api/admin/products" -Method POST -UseBasicParsing; throw "deveria ser 401" } catch { if ($_.Exception.Response.StatusCode -ne 401) { throw "esperava 401, veio $($_.Exception.Response.StatusCode)" } } }
  }
} catch {
  Write-Host "  (API not running - network tests skipped)" -ForegroundColor Yellow
}

$total = $passed + $failed
Write-Host "`n--- Resultado: $passed/$total passed, $failed failed ---" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
if ($failed -gt 0) { exit 1 }
