package com.fantasy.domain.user;

import com.fantasy.domain.intefaces.Identifiable;
import com.fantasy.domain.user.Exceptions.InvalidUserDetailsException;

import java.time.LocalDateTime;

public class User implements Comparable<User>, Identifiable {

    private final int id;
    private String name;
    private String username;
    private final UserRole role;
    private final LocalDateTime REGISTERED_AT;

    public User(String name, String username, UserRole role) {
        this.id = 0;
        this.name = name;
        this.username = username;
        this.role = role;
        this.REGISTERED_AT = LocalDateTime.now();

        setName(name);
        setUsername(username);
    }

    public User(int id, String name, String username, UserRole role, LocalDateTime registeredAt) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.role = role;
        this.REGISTERED_AT = registeredAt;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getUsername() { return username; }
    public UserRole getRole() { return role; } // Getter ל-Role
    public LocalDateTime getREGISTERED_AT() { return REGISTERED_AT; }

    public void setName(String name) {
        if (!UserDetailsValidation.checkValidName(name))
            throw new InvalidUserDetailsException("Invalid name");
        this.name = name;
    }

    public void setUsername(String username) {
        if (UserDetailsValidation.checkInvalidString(username))
            throw new InvalidUserDetailsException("Invalid username");
        this.username = username;
    }

    @Override
    public String toString() { return name; }

    @Override
    public int compareTo(User other) { return Integer.compare(other.id, this.id); }
}
