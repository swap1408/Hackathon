package com.cityasist.service;

import com.cityasist.api.dto.OperatorCreateRequest;
import com.cityasist.domain.Role;
import com.cityasist.domain.User;
import com.cityasist.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UsersService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UsersService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createOperator(OperatorCreateRequest req) {
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new RuntimeException("Email already in use");
        });
        User u = new User();
        u.setName(req.getName());
        u.setEmail(req.getEmail());
        u.setRole(Role.OPERATOR);
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        return userRepository.save(u);
    }

    public List<User> listByRole(Role role) {
        return userRepository.findAll().stream().filter(u -> u.getRole() == role).toList();
    }

    @Transactional
    public void delete(UUID id) {
        userRepository.deleteById(id);
    }
}
