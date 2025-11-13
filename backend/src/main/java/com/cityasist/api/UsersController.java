package com.cityasist.api;

import com.cityasist.api.dto.OperatorCreateRequest;
import com.cityasist.domain.Role;
import com.cityasist.domain.User;
import com.cityasist.service.UsersService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UsersController {
    private final UsersService usersService;

    public UsersController(UsersService usersService) {
        this.usersService = usersService;
    }

    @PostMapping("/operators")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createOperator(@Valid @RequestBody OperatorCreateRequest req) {
        return ResponseEntity.ok(usersService.createOperator(req));
    }

    @GetMapping("/operators")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> listOperators() {
        return ResponseEntity.ok(usersService.listByRole(Role.OPERATOR));
    }

    @DeleteMapping("/operators/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOperator(@PathVariable UUID id) {
        usersService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
