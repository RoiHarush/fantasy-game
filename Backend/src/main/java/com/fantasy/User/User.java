package com.fantasy.User;

import com.fantasy.Intefaces.IFantasyTeam;
import com.fantasy.Intefaces.Identifiable;
import com.fantasy.User.Exceptions.InvalidUserDetailsException;

import java.time.LocalDateTime;
import java.util.List;
//TODO: Add exceptions
public class User implements Comparable<User>, Identifiable {
    private static int idGenerator = 0;
    private final int id;
    private String name;
    private String username;
    private String password;
    private int tablePosition;
    private List<String> chips;
    private IFantasyTeam fantasyTeam;
    private final LocalDateTime REGISTERED_AT;
    private boolean isActive;

    public User(String name, String username, String password){
        this.id = ++idGenerator;
        setName(name);
        setUsername(username);
        setPassword(password);
        setTablePosition(this.id);
        this.REGISTERED_AT = LocalDateTime.now();
    }

    // <editor-fold desc="Getters and Setters">
    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (!UserDetailsValidation.checkValidName(name))
            throw new InvalidUserDetailsException("Invalid name: ");
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        if (UserDetailsValidation.checkInvalidString(username))
            throw new InvalidUserDetailsException("Invalid username: ");
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        if (!UserDetailsValidation.checkValidPassword(password))
            throw new InvalidUserDetailsException("Invalid password: ");
        this.password = password;
    }

    public int getId() {
        return id;
    }

    public int getTablePosition() {
        return tablePosition;
    }

    public void setTablePosition(int tablePosition) {
        this.tablePosition = tablePosition;
    }

    public List<String> getChips() {
        return chips;
    }

    public IFantasyTeam getFantasyTeam() {
        return fantasyTeam;
    }

    public void setFantasyTeam(IFantasyTeam fantasyTeam) {
        this.fantasyTeam = fantasyTeam;
    }

    public LocalDateTime getREGISTERED_AT() {
        return REGISTERED_AT;
    }

    public boolean getIsActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
    // </editor-fold>

    @Override
    public String toString(){
        return this.name;
    }

    @Override
    public int compareTo(User other) {
        return Integer.compare(other.id, this.id);
    }
}
