# Tests complets Better Auth avec roles
Write-Host "LANCEMENT DES TESTS COMPLETS AVEC ROLES..." -ForegroundColor Cyan
Write-Host ""

# Verifier que le serveur est actif
$serverCheck = try { 
    Invoke-WebRequest -Uri "http://localhost:4321" -Method HEAD -TimeoutSec 5 
    $true 
} catch { 
    $false 
}

if (-not $serverCheck) {
    Write-Host "ERREUR: Serveur non accessible sur localhost:4321" -ForegroundColor Red
    Write-Host "Veuillez demarrer le serveur avec: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "Serveur detecte sur localhost:4321" -ForegroundColor Green
Write-Host ""

# Lancer les tests Node.js avec roles
Write-Host "Execution des tests complets avec roles..." -ForegroundColor Yellow
node tests/auth-tests-roles.js

Write-Host ""
Write-Host "Tests termines!" -ForegroundColor Green
