package com.fantasy.Intefaces;

import java.util.List;

public interface Repository<T> {
    T getById(int id);
    void loadOne(T t);
    void loadMany(List<T> tees);
}
