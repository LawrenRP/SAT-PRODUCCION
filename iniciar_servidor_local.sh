#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8000

cd "$DIR"

if [ -f "$DIR/.venv/bin/uvicorn" ]; then
  UVICORN_EXEC="$DIR/.venv/bin/uvicorn"
elif [ -f "$DIR/../Laboratorio_EWS/.venv/bin/uvicorn" ]; then
  UVICORN_EXEC="$DIR/../Laboratorio_EWS/.venv/bin/uvicorn"
else
  UVICORN_EXEC="uvicorn"
fi

if which xdg-open > /dev/null 2>&1; then
  (sleep 1.5 && xdg-open "http://localhost:$PORT") &
fi

PYTHONPATH="$DIR" $UVICORN_EXEC backend.app.main:app --host 0.0.0.0 --port $PORT --reload
