package com.fantasy.domain.user;

import com.fantasy.domain.intefaces.Repository;
import com.fantasy.domain.user.Exceptions.NullUserException;

import java.util.*;
//TODO: Add exceptions
@org.springframework.stereotype.Repository
public class FantasyUserRegistry implements Repository<User> {
    private final List<User> users;
    private final Map<Integer, User> userByID;
    private final Map<String, User> userByUsername;

    public FantasyUserRegistry() {
        this.users = new ArrayList<>();
        this.userByID = new HashMap<>();
        this.userByUsername = new HashMap<>();
    }

    public boolean isEmpty(){
        return users.isEmpty() && userByID.isEmpty() && userByUsername.isEmpty();
    }

    public List<User> getUsers(){
        return users;
    }

    public void add(User user) {
        if (user == null)
            throw new NullUserException();
        this.users.add(user);
        this.userByID.put(user.getId(), user);
        this.userByUsername.put(user.getUsername(), user);
    }

    public void addMany(List<User> users){
        for (User user : users)
            add(user);
    }

    public User getUser(User user){
        for (User u : this.users)
            if (user != null && user.equals(u))
                return u;
        return null;
    }

    public User findById(int id){
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