package com.ptutor.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ptutor.backend.entity.Employee;
import com.ptutor.backend.entity.enums.EmployeeJobFunction;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByUser_Id(UUID userId);

    /** Nhân viên đang làm việc có chức năng {@code jobFunction}, cộng mọi ADMIN. */
    @Query("""
            select employee.user.id from Employee employee
            where employee.active = true
              and employee.deletedAt is null
              and (employee.user.role = com.ptutor.backend.dto.enums.UserRole.ADMIN
                   or employee.jobFunction = :jobFunction)
            """)
    List<UUID> findActiveUserIdsForJobFunction(@Param("jobFunction") EmployeeJobFunction jobFunction);
}
