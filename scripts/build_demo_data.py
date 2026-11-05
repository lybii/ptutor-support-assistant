"""Sinh dữ liệu demo cho backend từ fixture eval của assistant-service.

Mỗi vai trò (STUDENT, TUTOR) có một file JSON: khoá là đường dẫn mẫu trong tool-catalog/tools.yaml
(ví dụ `/api/v1/users/me/contracts/{contractId}`), giá trị là fixture (`default` + `byArgs`).
Bỏ qua thông báo và yêu cầu hỗ trợ: hai phần này backend lưu thật trong PostgreSQL.

Chạy từ thư mục gốc repo:  python scripts/build_demo_data.py
"""

from __future__ import annotations

import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "assistant-service" / "eval" / "fixtures" / "scenarios"
OUTPUT = ROOT / "backend" / "src" / "main" / "resources" / "demo-data"
SCENARIOS = {"STUDENT": "student_two_contracts", "TUTOR": "tutor_basic"}
SERVED_BY_BACKEND = ("/notifications", "/support-requests")


def main() -> None:
    catalog = yaml.safe_load((ROOT / "tool-catalog" / "tools.yaml").read_text(encoding="utf-8"))
    paths = {tool["func_code"]: tool["request"]["path"] for tool in catalog["tools"] if tool.get("status") == "ready"}
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for role, scenario in SCENARIOS.items():
        dataset = {}
        for fixture in sorted((FIXTURES / scenario).glob("*.json")):
            path = paths.get(fixture.stem)
            if path is None or any(part in path for part in SERVED_BY_BACKEND):
                continue
            dataset[path] = json.loads(fixture.read_text(encoding="utf-8"))
        target = OUTPUT / f"{role}.json"
        target.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{target.relative_to(ROOT)}: {len(dataset)} endpoint")


if __name__ == "__main__":
    main()
