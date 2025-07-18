package com.fantasy.User;

import com.fantasy.Intefaces.Repository;
import com.fantasy.User.Exceptions.NullUserException;

import java.util.*;
//TODO: Add exceptions
public class UserRepository implements Repository<User> {
    private final List<User> users;
    private final Map<Integer, User> userByID;
    private final Map<String, User> userByUsername;

    public UserRepository() {
        this.users = new ArrayList<>();
        this.userByID = new HashMap<>();
        this.userByUsername = new HashMap<>();
    }

    public void loadOne(User user) {
        if (user == null)
            throw new NullUserException();
        this.users.add(user);
        this.userByID.put(user.getId(), user);
        this.userByUsername.put(user.getUsername(), user);
    }

    public void loadMany(List<User> users){
        for (User user : users)
            loadOne(user);
    }

    public User getUser(User user){
        for (User u : this.users)
            if (user != null && user.equals(u))
                return u;
        return null;
    }

    public User getById(int id){
        return this.userByID.get(id);
    }

    public User getUserByUsername(String username){
        return this.userByUsername.get(username);
    }

    @Override
    public String toString(){
        return this.users.toString();
    }
}