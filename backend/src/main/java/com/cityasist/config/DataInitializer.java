package com.cityasist.config;

import com.cityasist.domain.Role;
import com.cityasist.domain.User;
import com.cityasist.repo.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDefaultAdmin(UserRepository users, PasswordEncoder encoder,
                                       @Value("${APP_ADMIN_EMAIL:admin@cityasist.local}") String adminEmail,
                                       @Value("${APP_ADMIN_PASSWORD:pass123}") String adminPassword) {
        return args -> {
            users.findByEmail(adminEmail).orElseGet(() -> {
                User u = new User();
                u.setName("Admin");
                u.setEmail(adminEmail);
                u.setRole(Role.ADMIN);
                u.setPasswordHash(encoder.encode(adminPassword));
                return users.save(u);
            });
        };
    }
}
