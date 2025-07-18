package com.fantasy.User;

import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.User.Exceptions.NullUserException;
import com.fantasy.User.Exceptions.UserNotFoundException;
import com.fantasy.User.Exceptions.UsernameAlreadyExistException;
import com.fantasy.User.Exceptions.WrongPasswordException;

//TODO: Add exceptions
public final class UserManager {
    private final UserRepository users;

    public UserManager(UserRepository users){
        this.users = users;
    }

    public User register(String name, String userName, String password){
        if (this.users.getUserByUsername(userName) != null)
            throw new UsernameAlreadyExistException(userName);
        User user = new User(name, userName, password);
        this.users.loadOne(user);
        return user;
    }

    public void UpdateFantasyTeam(FantasyTeam fantasyTeam, User user){
        if (user == null)
            throw new NullUserException();
        user.setFantasyTeam(fantasyTeam);
    }

    public User login(String username, String password){
        User user = this.users.getUserByUsername(username);
        if (user == null)
            throw new UserNotFoundException(username);
        if (!user.getPassword().equals(password))
            throw new WrongPasswordException();
        return user;
    }

    public User getUserById(int id){
        return this.users.getById(id);
    }

    public User getUserByUsername(String username){
        return this.users.getUserByUsername(username);
    }
}