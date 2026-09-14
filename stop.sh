#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$ROOT_DIR/.runtime/pids"

stop_tree() {
  local pid="$1"
  local child

  while IFS= read -r child; do
    [[ -n "$child" ]] && stop_tree "$child"
  done < <(pgrep -P "$pid" 2>/dev/null || true)

  kill -TERM "$pid" 2>/dev/null || true
}

stop_service() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  [[ -f "$pid_file" ]] || return

  local pid command_line
  pid="$(<"$pid_file")"
  command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"

  if [[ -n "$command_line" && "$command_line" == *"$ROOT_DIR"* ]]; then
    stop_tree "$pid"
    echo "■ أُوقِف $name"
  elif [[ -n "$command_line" ]]; then
    echo "! لم أوقف $name لأن العملية لا تنتمي إلى هذا المشروع." >&2
  fi

  rm -f "$pid_file"
}

for service in web api-gateway academic-service people-service auth-service; do
  stop_service "$service"
done

cd "$ROOT_DIR"
docker compose stop

echo "تم إيقاف الخدمات وحاوية PostgreSQL. البيانات محفوظة في Docker volume."
