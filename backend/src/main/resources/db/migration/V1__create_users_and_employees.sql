-- Tài khoản người dùng và hồ sơ nhân viên.
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('STUDENT', 'TUTOR', 'EMPLOYEE', 'ADMIN'))
);

-- ADMIN cũng có hồ sơ nhân viên (job_function trống) để xử lý được hàng chờ yêu cầu hỗ trợ.
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    job_function VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_employees_user UNIQUE (user_id),
    CONSTRAINT ck_employees_job_function CHECK (job_function IS NULL OR job_function IN ('CUSTOMER_SERVICE', 'ACCOUNTANT'))
);
