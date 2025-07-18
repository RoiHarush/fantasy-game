package com.fantasy.UserTest;

import com.fantasy.User.Exceptions.NullUserException;
import com.fantasy.User.User;
import com.fantasy.User.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class UserRepositoryTest {

    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        this.userRepository = new UserRepository();
    }

    @Test
    void shouldThrowWhenLoadingNullUser() {
        assertThrows(NullUserException.class, () -> {
            this.userRepository.loadOne(null);
        });
    }

    @Test
    void shouldLoadUserSuccessfully() {
        User u1 = new User("Roi", "roi3012", "3012000");
        this.userRepository.loadOne(u1);

        User fetched = this.userRepository.getUserByUsername("roi3012");
        assertEquals(u1.getUsername(), fetched.getUsername());
    }
}

