$base = "d:\Nam 4\Dự án cá nhân\Thesis\thesis-frontend\src"
$folders = @(
    "app\(auth)",
    "app\(auth)\login",
    "app\(dashboard)",
    "app\(dashboard)\student",
    "app\(dashboard)\student\dashboard",
    "app\(dashboard)\student\topic-registrations",
    "app\(dashboard)\student\topic-proposals",
    "app\(dashboard)\student\progress-logs",
    "app\(dashboard)\student\periodic-reports",
    "app\(dashboard)\student\my-topic",
    "app\(dashboard)\lecturer",
    "app\(dashboard)\lecturer\dashboard",
    "app\(dashboard)\lecturer\topics",
    "app\(dashboard)\lecturer\topic-categories",
    "app\(dashboard)\lecturer\topic-proposals",
    "app\(dashboard)\lecturer\progress-plans",
    "app\(dashboard)\faculty-staff",
    "app\(dashboard)\faculty-staff\dashboard",
    "app\(dashboard)\faculty-staff\registration-periods",
    "app\(dashboard)\admin",
    "app\(dashboard)\admin\dashboard",
    "app\(dashboard)\admin\users",
    "components\common",
    "components\ui",
    "lib",
    "contexts",
    "types"
)
foreach ($f in $folders) {
    $path = Join-Path $base $f
    New-Item -ItemType Directory -Force -Path $path | Out-Null
}
Write-Host "All folders created"
