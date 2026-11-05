# PTutor Support Assistant

Trợ lý hỗ trợ (chatbot RAG + tra cứu dữ liệu) cho **PTutor**, nền tảng kết nối học viên và gia sư. Gồm
dịch vụ AI (FastAPI), API gateway (Spring Boot) và giao diện web (React).

## Tính năng

- Trả lời câu hỏi về cách dùng nền tảng, dựa trên **kho tri thức 66 tài liệu Markdown**, có **trích dẫn nguồn** cho từng ý.
- Tra cứu dữ liệu của chính người hỏi (hợp đồng, buổi học, ví, hoàn tiền...) bằng **công cụ chỉ-đọc** gọi API "của tôi"
  của backend, với token của người dùng.
- Chặn câu hỏi ngoài phạm vi, chống prompt injection, che thông tin cá nhân trong log.
- Kiểm chứng câu trả lời trước khi gửi (verifier); không đủ căn cứ thì từ chối thay vì bịa.
- Chuyển thành **yêu cầu hỗ trợ** cho nhân viên khi trợ lý không giải quyết được; nhân viên nhận, trả lời; người dùng
  được báo qua thông báo.
- Trang quản trị: soạn, công bố, khôi phục phiên bản tài liệu; xem câu hỏi chưa trả lời được và thống kê.

## Kiến trúc

```
frontend (React, nginx)  ──JWT──▶  backend (Spring Boot)  ──X-Internal-Token──▶  assistant-service (FastAPI)
  widget chat,                       xác thực, rate limit,                         AgentRunner + 17 middleware
  trang tài khoản,                   proxy trợ lý,                ◀──tool GET──    truy xuất lai pgvector + full-text (RRF)
  trang quản trị                     yêu cầu hỗ trợ, thông báo                     verifier, chặn phạm vi, che PII
                                              └──────────── PostgreSQL + pgvector ───────────┘
```

| Thư mục | Nội dung |
|---|---|
| [`assistant-service/`](assistant-service/) | Dịch vụ AI: harness agent, truy xuất, công cụ, eval, test |
| [`backend/`](backend/) | Spring Boot: JWT, proxy trợ lý, rate limiter, yêu cầu hỗ trợ, thông báo, API dữ liệu tài khoản |
| [`frontend/`](frontend/) | React + TypeScript: widget chat, trang tài khoản, quản trị kho tri thức, hàng chờ yêu cầu hỗ trợ |
| [`knowledge-base/`](knowledge-base/) | Kho tri thức Markdown (front matter, route màn hình) |
| [`tool-catalog/`](tool-catalog/) | Danh mục công cụ tra cứu (`tools.yaml`): đường dẫn, vai trò, trường được phép trả về |
| [`docs/`](docs/) | Thiết kế (phạm vi, kiến trúc, luồng hỏi đáp, bảo mật, eval) và nhật ký triển khai |

## Chạy

Cần Docker. Mặc định trợ lý trả lời bằng chế độ `scripted` (tất định, không cần API key).

```bash
cp .env.example .env          # điền mật khẩu DB, JWT_SECRET, ASSISTANT_INTERNAL_TOKEN, DEMO_USER_PASSWORD
docker compose up -d --build
```

Mở http://localhost:8088, đăng nhập bằng một tài khoản demo (mật khẩu = `DEMO_USER_PASSWORD`):

| Tài khoản | Vai trò | Thử gì |
|---|---|---|
| `hocvien@ptutor.demo` | Học viên | Hỏi trợ lý "Làm sao để yêu cầu hoàn tiền?", "Hợp đồng của tôi đang thế nào?"; gửi yêu cầu hỗ trợ |
| `giasu@ptutor.demo` | Gia sư | "Số dư ví của tôi là bao nhiêu?" |
| `hotro@ptutor.demo` | Nhân viên hỗ trợ | Nhận và trả lời yêu cầu hỗ trợ |
| `admin@ptutor.demo` | Quản trị viên | Sửa, công bố tài liệu kho tri thức; xem thống kê |

Dùng model thật: trong `.env` đặt `ASSISTANT_LLM_PROVIDER=openai`, `ASSISTANT_LLM_MODEL=gpt-4.1-mini`, `OPENAI_API_KEY`.

Dữ liệu tài khoản demo (hợp đồng, ví, buổi học...) sinh từ fixture eval bằng `python scripts/build_demo_data.py`;
yêu cầu hỗ trợ và thông báo lưu thật trong PostgreSQL.

## Phát triển và kiểm thử

```bash
# assistant-service
cd assistant-service && python -m venv .venv && .venv/Scripts/pip install -r requirements-dev.txt
.venv/Scripts/python -m pytest -q -m "not contract"
.venv/Scripts/python scripts/check_catalog.py      # công cụ khớp controller backend, route kho tri thức khớp App.tsx
.venv/Scripts/python -m eval.run --mode quick --split dev

# backend (Java 21)
cd backend && ./mvnw test                           # test tích hợp với PostgreSQL: ./mvnw -Pintegration test

# frontend (Node 24)
cd frontend && npm install && npm run dev           # http://localhost:5173, proxy /api tới backend :8080
```

## Kết quả đánh giá

Model `gpt-4.1-mini`, embedding bge-m3, tập test 140 case ([báo cáo đầy đủ](docs/trien-khai/BAO-CAO-DANH-GIA.md)):

| Chỉ số | Kết quả |
|---|---|
| Tỉ lệ đạt trên tập test | 86,4% |
| Case an toàn (injection, ngoài phạm vi, lộ dữ liệu) | 26/26 |
| Recall@6 truy xuất | 92,4% |
| Verifier bắt câu trả lời sai / bác nhầm câu đúng | 100% / 0% |
| Chi phí một lượt hỏi | ≈ 0,002 $ |

## Công nghệ

Python 3.12, FastAPI, SQLAlchemy, Alembic, OpenAI API, pytest · Java 21, Spring Boot 4, Spring Security (JWT),
Flyway · React 19, TypeScript, Vite · PostgreSQL 17 + pgvector · Docker Compose, nginx
