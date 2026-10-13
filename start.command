#!/bin/bash
cd "$(dirname "$0")"
PORT=8766
if ! lsof -i :$PORT >/dev/null 2>&1; then
  nohup python3 -m http.server $PORT >/tmp/iphone_anatomy_http.log 2>&1 &
  sleep 0.6
fi
open -a "Brave Browser" "http://localhost:$PORT"
