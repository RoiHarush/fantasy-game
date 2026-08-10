package com.fantasy.domain.user;

import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PutMapping(value = "/team", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> updateTeam(
            @RequestParam String teamName,
            @RequestPart(name = "logo", required = false) MultipartFile logo,
            Authentication authentication) {
        return ResponseEntity.ok(userService.updateTeamProfile(
                authenticatedUserId(authentication),
                teamName,
                logo
        ));
    }

    @DeleteMapping("/team/logo")
    public ResponseEntity<UserDto> removeTeamLogo(Authentication authentication) {
        return ResponseEntity.ok(userService.removeTeamLogo(authenticatedUserId(authentication)));
    }

    @GetMapping("/{id}/team-logo")
    public ResponseEntity<byte[]> getTeamLogo(@PathVariable int id, Authentication authentication) {
        UserService.TeamLogoContent logo = userService.getTeamLogo(authenticatedUserId(authentication), id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(logo.contentType()))
                .cacheControl(CacheControl.noCache())
                .body(logo.bytes());
    }

    private int authenticatedUserId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
