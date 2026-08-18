#!/usr/bin/env bash
# Starts the Priority-1 user-space Postgres used for local API development.
set -euo pipefail
export PATH="${HOME}/.local/mamba/envs/olimpia-pg/bin:${HOME}/.local/bin:${PATH}"
PGDATA="${HOME}/.local/olimpia-pgdata"
LOG="${HOME}/.local/olimpia-pg.log"
PORT=5433
if ! command -v pg_ctl >/dev/null; then
  echo "Local Postgres not found. Expected micromamba env at ~/.local/mamba/envs/olimpia-pg"
  exit 1
fi
if pg_ctl -D "$PGDATA" -o "-p $PORT" status >/dev/null 2>&1; then
  echo "Postgres already running on port $PORT"
else
  pg_ctl -D "$PGDATA" -l "$LOG" -o "-p $PORT" start
  echo "Postgres started on port $PORT"
fi
echo "DATABASE_URL=postgresql://postgres@127.0.0.1:${PORT}/olimpia_dev"
