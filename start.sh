#!/bin/bash
cd /app/backend && python3 server.py &
cd /app/frontend && node_modules/.bin/next start
