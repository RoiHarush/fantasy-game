package com.fantasy.domain.intefaces;

import java.util.List;

public interface Repository<T> {
    T findById(int id);
    void add(T t);
    void addMany(List<T> tees);
}