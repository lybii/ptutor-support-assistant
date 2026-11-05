package com.ptutor.backend.entity;

import com.ptutor.backend.entity.enums.EmployeeJobFunction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Hồ sơ nhân viên. ADMIN cũng có hồ sơ (không có chức năng) để xử lý được hàng chờ yêu cầu hỗ trợ. */
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
public class Employee extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_function", length = 30)
    private EmployeeJobFunction jobFunction;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
