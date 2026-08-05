package com.fantasy.domain.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers(Authentication authentication) {
        return ResponseEntity.ok(userService.getAllUsers(authenticatedUserId(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable int id, Authentication authentication) {
        return ResponseEntity.ok(userService.getUserById(authenticatedUserId(authentication), id));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@RequestBody UpdateProfileDto request, Authentication authentication) {
        int userId = authenticatedUserId(authentication);
        return ResponseEntity.ok(userService.updateUserProfile(userId, request));
    }

    private int authenticatedUserId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
