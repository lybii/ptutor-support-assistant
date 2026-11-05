# PTutor Support Assistant

Trợ lý hỗ trợ (chatbot RAG + tra cứu dữ liệu) cho **PTutor**, nền tảng kết nối học viên và gia sư.

> Đây là module tôi thực hiện trong đồ án nhóm PTutor. Repo này chỉ chứa phần do tôi viết (lịch sử commit
> được giữ nguyên). Các phần còn lại của nền tảng (đăng ký, hợp đồng, thanh toán...) thuộc các thành viên khác
> và không có ở đây.

## Trợ lý làm được gì

- Trả lời câu hỏi về cách dùng nền tảng, dựa trên **kho tri thức 66 tài liệu Markdown** và **trích dẫn nguồn** cho từng ý.
- Tra cứu dữ liệu của chính người hỏi (hợp đồng, buổi học, hoàn tiền...) bằng **công cụ chỉ-đọc** gọi API "của tôi" của backend.
- Chặn câu hỏi ngoài phạm vi, chống prompt injection, che thông tin cá nhân trong log.
- Kiểm chứng câu trả lời trước khi gửi (verifier); không đủ căn cứ thì từ chối thay vì bịa.
- Chuyển thành **yêu cầu hỗ trợ** cho nhân viên khi trợ lý không giải quyết được.
- Trang quản trị: soạn, công bố, lưu phiên bản tài liệu; xem câu hỏi chưa trả lời được và thống kê.

## Kiến trúc

```
Frontend (React)  ──JWT──▶  Backend (Spring Boot)  ──X-Internal-Token──▶  assistant-service (FastAPI)
  widget chat,               AssistantController,                         AgentRunner + 17 middleware
  trang admin KB             rate limit, proxy,            ◀──tool GET──  truy xuất lai pgvector + full-text (RRF)
                             yêu cầu hỗ trợ                               Postgres (schema assistant)
```

| Thư mục | Nội dung |
|---|---|
| [`assistant-service/`](assistant-service/) | Lõi Python: harness agent, truy xuất, công cụ, eval, test |
| [`knowledge-base/`](knowledge-base/) | Kho tri thức Markdown (front matter, route màn hình) |
| [`tool-catalog/`](tool-catalog/) | Danh mục công cụ tra cứu (`tools.yaml`): đường dẫn, trường được phép trả về |
| [`integration/backend/`](integration/backend/) | Phần tôi thêm vào backend Java: proxy, rate limiter, yêu cầu hỗ trợ, migration Flyway |
| [`integration/frontend/`](integration/frontend/) | Phần tôi thêm vào frontend: widget chat, trang quản trị kho tri thức và yêu cầu hỗ trợ |
| [`docs/`](docs/) | Thiết kế (phạm vi, kiến trúc, luồng hỏi đáp, bảo mật, eval) và nhật ký triển khai |

`integration/` là code trích ra từ repo nhóm, để đọc. Nó cần phần còn lại của backend/frontend mới build được.

## Kết quả đánh giá

Model `gpt-4.1-mini`, embedding bge-m3, tập test 140 case ([báo cáo đầy đủ](docs/trien-khai/BAO-CAO-DANH-GIA.md)):

| Chỉ số | Kết quả |
|---|---|
| Tỉ lệ đạt trên tập test | 86,4% |
| Case an toàn (injection, ngoài phạm vi, lộ dữ liệu) | 26/26 |
| Recall@6 truy xuất | 92,4% |
| Verifier bắt câu trả lời sai / bác nhầm câu đúng | 100% / 0% |
| Chi phí một lượt hỏi | ≈ 0,002 $ |

## Chạy thử

Không cần backend: công cụ tra cứu chạy bằng fixture, câu trả lời dùng Actor tất định (không cần API key).

```bash
cp .env.example .env        # điền POSTGRES_PASSWORD và ASSISTANT_INTERNAL_TOKEN
docker compose up -d --build
docker compose run --rm assistant-service kb-import --publish --allow-todo

curl -X POST http://localhost:8100/v1/chat \
  -H "X-Internal-Token: <token>" -H "X-User-Id: 00000000-0000-0000-0000-000000000001" -H "X-User-Role: STUDENT" \
  -H "Content-Type: application/json" -d '{"message": "Làm sao để yêu cầu hoàn tiền?"}'
```

Muốn dùng model thật: trong `.env` đặt `ASSISTANT_LLM_PROVIDER=openai`, `ASSISTANT_LLM_MODEL` và `OPENAI_API_KEY`.

Chạy test và eval (không tốn tiền): xem [`assistant-service/README.md`](assistant-service/README.md).

## Công nghệ

Python 3.12, FastAPI, SQLAlchemy, Alembic, PostgreSQL + pgvector, OpenAI API, pytest, ruff, mypy ·
Spring Boot (Java) · React + TypeScript · Docker Compose
