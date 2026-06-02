Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#\s][^=]*)\s*=\s*(.*)\s*$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
    }
}
$env:USE_MEMORY_STORE = "true"
$env:ADMIN_PASSWORD = "admin"
go run .
