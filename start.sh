#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
PID_DIR="$RUNTIME_DIR/pids"
LOG_DIR="$RUNTIME_DIR/logs"
NODE_BIN="${NODE_BIN:-}"

if [[ -z "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node || true)"
fi

if [[ -z "$NODE_BIN" && -x /usr/local/bin/node ]]; then
  NODE_BIN="/usr/local/bin/node"
fi

if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "Node.js غير متاح. ثبّت Node.js أو مرّر مساره عبر NODE_BIN." >&2
  exit 1
fi

export PATH="$(dirname "$NODE_BIN"):$PATH"

mkdir -p "$PID_DIR" "$LOG_DIR"
cd "$ROOT_DIR"

is_running() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(<"$pid_file")"

  if kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  rm -f "$pid_file"
  return 1
}

launch() {
  local name="$1"
  local port="$2"
  shift 2

  if is_running "$name"; then
    echo "✓ $name يعمل بالفعل (PID $(<"$PID_DIR/$name.pid"))"
    return
  fi

  if nc -z 127.0.0.1 "$port" 2>/dev/null; then
    echo "! المنفذ $port مستخدم بالفعل؛ لم يبدأ $name مرة أخرى."
    return
  fi

  nohup "$@" >"$LOG_DIR/$name.log" 2>&1 &
  echo $! >"$PID_DIR/$name.pid"
  echo "▶ بدأ $name (PID $(<"$PID_DIR/$name.pid"))"
}

wait_for_port() {
  local name="$1"
  local port="$2"
  local attempts=45

  while (( attempts > 0 )); do
    if nc -z 127.0.0.1 "$port" 2>/dev/null; then
      echo "✓ $name جاهز على http://localhost:$port"
      return
    fi
    sleep 2
    ((attempts--))
  done

  echo "! لم يتأكد فتح منفذ $name. راجع: $LOG_DIR/$name.log" >&2
}

echo "تهيئة PostgreSQL..."
docker compose up -d

echo "تحديث Prisma..."
"$ROOT_DIR/node_modules/.bin/prisma" generate
"$ROOT_DIR/node_modules/.bin/prisma" db push

launch auth-service 3001 env "SWC_NODE_PROJECT=$ROOT_DIR/auth-service/tsconfig.app.json" \
  "$NODE_BIN" -r @swc-node/register "$ROOT_DIR/auth-service/src/main.ts"
launch people-service 3002 env "SWC_NODE_PROJECT=$ROOT_DIR/people-service/tsconfig.app.json" \
  "$NODE_BIN" -r @swc-node/register "$ROOT_DIR/people-service/src/main.ts"
launch academic-service 3003 env "SWC_NODE_PROJECT=$ROOT_DIR/academic-service/tsconfig.app.json" \
  "$NODE_BIN" -r @swc-node/register "$ROOT_DIR/academic-service/src/main.ts"
launch api-gateway 3000 env "SWC_NODE_PROJECT=$ROOT_DIR/api-gateway/tsconfig.app.json" \
  "$NODE_BIN" -r @swc-node/register "$ROOT_DIR/api-gateway/src/main.ts"
launch web 4200 env NX_DAEMON=false "$NODE_BIN" "$ROOT_DIR/node_modules/nx/dist/bin/nx.js" serve web

wait_for_port auth-service 3001
wait_for_port people-service 3002
wait_for_port academic-service 3003
wait_for_port api-gateway 3000
wait_for_port web 4200

echo
echo "النظام يعمل: http://localhost:4200"
echo "السجلات: $LOG_DIR"
