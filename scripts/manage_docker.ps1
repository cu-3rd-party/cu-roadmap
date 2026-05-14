param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("up", "down", "rebuild-front", "rebuild-back", "logs")]
    $Action = "up"
)

switch ($Action) {
    "up" {
        Write-Host "🚀 Starting all containers..." -ForegroundColor Cyan
        docker-compose up -d
    }
    "down" {
        Write-Host "🛑 Stopping all containers..." -ForegroundColor Yellow
        docker-compose down
    }
    "rebuild-front" {
        Write-Host "🔄 Rebuilding Frontend..." -ForegroundColor Green
        docker-compose up -d --no-deps --build frontend
    }
    "rebuild-back" {
        Write-Host "🔄 Rebuilding Backend..." -ForegroundColor Green
        docker-compose up -d --no-deps --build backend
    }
    "logs" {
        docker-compose logs -f
    }
}
