$headers = @{
    'Authorization' = 'token YOUR_GITHUB_TOKEN_HERE'
    'Accept' = 'application/vnd.github.v3+json'
}

$body = @{
    name = 'my-saas-platform'
    description = 'Payload SaaS Platform with blocks architecture'
    private = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Method Post -Headers $headers -Body $body
    Write-Host "Repository created successfully: $($response.html_url)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host $_.Exception.Response
}

