package com.fantasy.UserTest;

import com.fantasy.User.Exceptions.UsernameAlreadyExistException;
import com.fantasy.User.Exceptions.UserNotFoundException;
import com.fantasy.User.Exceptions.WrongPasswordException;
import com.fantasy.User.User;
import com.fantasy.User.UserManager;
import com.fantasy.User.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class UserManagerTest {

    private UserRepository repository;
    private UserManager manager;

    @BeforeEach
    void setUp() {
        repository = new UserRepository();
        manager = new UserManager(repository);
    }

    @Test
    void shouldRegisterUserSuccessfully() {
        User user = manager.register("Roi", "roi3012", "1234");
        assertNotNull(user);
        assertEquals("roi3012", user.getUsername());
        assertEquals("Roi", user.getName());
    }

    @Test
    void shouldThrowWhenRegisteringWithExistingUsername() {
        manager.register("Roi", "roi3012", "1234");
        assertThrows(UsernameAlreadyExistException.class, () -> {
            manager.register("Omri", "roi3012", "abcd");
        });
    }

    @Test
    void shouldLoginSuccessfully() {
        manager.register("Roi", "roi3012", "1234");
        User user = manager.login("roi3012", "1234");
        assertNotNull(user);
        assertEquals("roi3012", user.getUsername());
    }

    @Test
    void shouldThrowWhenLoginWithNonExistingUser() {
        assertThrows(UserNotFoundException.class, () -> {
            manager.login("unknownUser", "1234");
        });
    }

    @Test
    void shouldThrowWhenLoginWithWrongPassword() {
        manager.register("Roi", "roi3012", "1234");
        assertThrows(WrongPasswordException.class, () -> {
            manager.login("roi3012", "wrongpass");
        });
    }

    @Test
    void shouldGetUserByIdSuccessfully() {
        User user = manager.register("Roi", "roi3012", "1234");
        User fetched = manager.getUserById(user.getId());
        assertEquals(user.getId(), fetched.getId());
    }

    @Test
    void shouldGetUserByUsernameSuccessfully() {
        User user = manager.register("Roi", "roi3012", "1234");
        User fetched = manager.getUserByUsername("roi3012");
        assertEquals(user.getUsername(), fetched.getUsername());
    }
}
