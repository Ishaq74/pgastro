# Tests Better Auth PowerShell
Write-Host "🚀 TESTS BETTER AUTH - POWERSHELL" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

$baseUrl = "http://localhost:4321"
$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$Method = "GET",
        [string]$Body = $null
    )
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        $params = @{
            Uri = "$baseUrl$Url"
            Method = $Method
            Headers = $headers
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ $Name" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Name - Status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ $Name - Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Tests des pages
Write-Host "`n📄 TESTS DES PAGES:" -ForegroundColor Yellow
$results += Test-Endpoint "Page d'accueil" "/"
$results += Test-Endpoint "Page inscription" "/register"
$results += Test-Endpoint "Page connexion" "/login" 
$results += Test-Endpoint "Page mot de passe oublié" "/forgot-password"
$results += Test-Endpoint "Page tests" "/tests"

# Tests des APIs
Write-Host "`n🔌 TESTS DES APIS:" -ForegroundColor Yellow
$results += Test-Endpoint "API DB Status" "/api/db-status"
$results += Test-Endpoint "API SMTP Status" "/api/smtp-status"
$results += Test-Endpoint "API Session" "/api/auth/get-session"

# Tests des redirections (302 attendu)
Write-Host "`n🔒 TESTS DE PROTECTION:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$baseUrl/dashboard" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 302) {
        Write-Host "✅ Dashboard redirige (protection OK)" -ForegroundColor Green
        $results += $true
    } else {
        Write-Host "❌ Dashboard pas protégé" -ForegroundColor Red
        $results += $false
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "✅ Dashboard redirige (protection OK)" -ForegroundColor Green
        $results += $true
    } else {
        Write-Host "❌ Dashboard - Erreur: $($_.Exception.Message)" -ForegroundColor Red
        $results += $false
    }
}

try {
    $response = Invoke-WebRequest "$baseUrl/profile" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 302) {
        Write-Host "✅ Profile redirige (protection OK)" -ForegroundColor Green
        $results += $true
    } else {
        Write-Host "❌ Profile pas protégé" -ForegroundColor Red
        $results += $false
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "✅ Profile redirige (protection OK)" -ForegroundColor Green
        $results += $true
    } else {
        Write-Host "❌ Profile - Erreur: $($_.Exception.Message)" -ForegroundColor Red
        $results += $false
    }
}

try {
    $response = Invoke-WebRequest "$baseUrl/admin" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 302) {
        Write-Host "✅ Admin redirige (protection OK)" -ForegroundColor Green
        $results += $true
    } else {
        Write-Host "❌ Admin pas protégé" -ForegroundColor Red
        $results += $false
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "✅ Admin redirige (protection OK)" -ForegroundColor Green
        $results += $true
    } else {
        Write-Host "❌ Admin - Erreur: $($_.Exception.Message)" -ForegroundColor Red
        $results += $false
    }
}

# Résumé
$passed = ($results | Where-Object { $_ -eq $true }).Count
$total = $results.Count
$failed = $total - $passed
$percentage = [math]::Round(($passed / $total) * 100, 1)

Write-Host "`n📊 RÉSUMÉ DES TESTS:" -ForegroundColor Cyan
Write-Host "=" * 30 -ForegroundColor Gray
Write-Host "✅ Tests réussis: $passed/$total" -ForegroundColor Green
Write-Host "❌ Tests échoués: $failed/$total" -ForegroundColor Red
Write-Host "📈 Taux de réussite: $percentage%" -ForegroundColor Blue

if ($failed -eq 0) {
    Write-Host "`n🎉 TOUS LES TESTS SONT PASSÉS!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Certains tests ont échoué" -ForegroundColor Yellow
}

Write-Host "`n🎯 Tests terminés!" -ForegroundColor Cyan
