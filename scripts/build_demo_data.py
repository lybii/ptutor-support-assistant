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

# Fixture eval cố ý chứa email giả "should-be-filtered" để kiểm tra bộ lọc trường. Trong bản demo, dữ liệu phải khớp
# tài khoản đang đăng nhập (DemoDataSeeder): học viên Nguyễn Lan, gia sư Trần An.
EMAILS = {
    "should-be-filtered@example.com": "hocvien@ptutor.demo",
    "tutor-should-be-filtered@example.com": "giasu@ptutor.demo",
}
TUTOR_FIELDS = {"firstName": "An", "lastName": "Trần", "tutorFirstName": "An", "tutorLastName": "Trần"}


def to_demo(value, role: str, key: str = ""):
    """Đổi dữ liệu fixture thành dữ liệu demo nhất quán với tài khoản demo."""
    if isinstance(value, dict):
        return {k: to_demo(v, role, k) for k, v in value.items()}
    if isinstance(value, list):
        return [to_demo(item, role, key) for item in value]
    if isinstance(value, str):
        if value in EMAILS:
            return EMAILS[value]
        if key == "bankAccountNumber":
            return "•••• " + value[-4:]
        if role == "TUTOR" and key in TUTOR_FIELDS:
            return TUTOR_FIELDS[key]
    return value


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
            dataset[path] = to_demo(json.loads(fixture.read_text(encoding="utf-8")), role)
        target = OUTPUT / f"{role}.json"
        target.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{target.relative_to(ROOT)}: {len(dataset)} endpoint")


if __name__ == "__main__":
    main()
