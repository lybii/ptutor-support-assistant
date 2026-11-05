#!/bin/sh
# Khởi động assistant-service trong container: chạy migration Alembic (schema assistant) rồi mở API.
# Nạp kho tri thức là việc riêng, chạy một lần (xem HUONG-DAN-DEMO.md):
#   docker compose --profile assistant run --rm assistant-service kb-import [--publish] [--allow-todo]
set -e
if [ "$1" = "kb-import" ]; then
  shift
  alembic upgrade head
  exec python -m app.kb.import --path /srv/knowledge-base "$@"
fi
alembic upgrade head
# Demo: nạp và công bố kho tri thức mỗi lần khởi động (tài liệu không đổi được bỏ qua).
if [ "${ASSISTANT_KB_AUTO_IMPORT:-false}" = "true" ]; then
  python -m app.kb.import --path /srv/knowledge-base --publish --allow-todo
fi
exec uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8100
