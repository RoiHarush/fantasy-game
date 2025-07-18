package com.fantasy.User;

public class UserDetailsValidation {

    public static boolean checkInvalidString(String detail){
        return detail == null  || detail.isEmpty();
    }

    public static boolean checkValidName(String name){
        if (checkInvalidString(name))
            return false;
        return name.matches("\\D+");
    }

    public static boolean checkValidPassword(String password){
        if (checkInvalidString(password))
            return false;
        return password.length() >= 4;
    }
}
