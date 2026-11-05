-- Yêu cầu hỗ trợ: người dùng tự gửi câu hỏi cho nhân viên CUSTOMER_SERVICE khi trợ lý không trả lời được
-- (docs/14-yeu-cau-ho-tro.md mục 14.4). Dữ liệu nghiệp vụ nên nằm ở schema public của backend.

CREATE SEQUENCE IF NOT EXISTS support_request_code_seq START 1;

CREATE TABLE support_requests (
    id UUID PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    user_role VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    source VARCHAR(20) NOT NULL,
    -- Tham chiếu sang schema assistant; cố ý không đặt khoá ngoại (hai service tách biệt).
    conversation_id UUID,
    message_id UUID,
    -- Chỉ có khi người dùng đồng ý đính kèm; tối đa 6 lượt, đã che thông tin cá nhân. Xoá sau 365 ngày kể từ khi đóng.
    conversation_excerpt JSONB,
    attach_conversation BOOLEAN NOT NULL DEFAULT FALSE,
    page_path VARCHAR(200),
    status VARCHAR(20) NOT NULL,
    assigned_employee_id UUID REFERENCES employees(id),
    answer TEXT,
    previous_request_id UUID REFERENCES support_requests(id),
    assigned_at TIMESTAMP,
    answered_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_support_requests_code UNIQUE (code),
    CONSTRAINT ck_support_requests_role CHECK (user_role IN ('STUDENT', 'TUTOR')),
    CONSTRAINT ck_support_requests_source CHECK (
        source IN ('ASSISTANT_ABSTAIN', 'ASSISTANT_PARTIAL', 'ASSISTANT_FEEDBACK', 'MENU')),
    CONSTRAINT ck_support_requests_status CHECK (
        status IN ('OPEN', 'IN_PROGRESS', 'ANSWERED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT ck_support_requests_question_length CHECK (char_length(question) BETWEEN 1 AND 2000),
    -- Chỉ đóng được sau khi đã có câu trả lời (OPEN → … → ANSWERED → CLOSED), nên hai trạng thái này luôn có answer.
    CONSTRAINT ck_support_requests_answer CHECK (status NOT IN ('ANSWERED', 'CLOSED') OR answer IS NOT NULL)
);

CREATE INDEX ix_support_requests_user_created ON support_requests (user_id, created_at DESC);
CREATE INDEX ix_support_requests_status_created ON support_requests (status, created_at);
CREATE INDEX ix_support_requests_assignee_status ON support_requests (assigned_employee_id, status);
