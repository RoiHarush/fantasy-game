package com.fantasy.api;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.dto.IrStatusDto;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UpdateProfileDto;
import com.fantasy.dto.UserDto;
import com.fantasy.application.UserService;

import com.fantasy.infrastructure.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepo;

    public UserController(UserService userService, UserRepository userRepo) {
        this.userService = userService;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserDto getUserById(@PathVariable int id) {
        return userService.getUserById(id);
    }

    @GetMapping("/{id}/squad")
    public SquadDto getSquadForGameweek(@PathVariable int id,
                                        @RequestParam int gw) {
        return userService.getSquadForGameweek(id, gw);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileDto request, Authentication authentication) {
        try {
            String userIdString = authentication.getName();

            int userId = Integer.parseInt(userIdString);

            UserDto updatedUser = userService.updateUserProfile(userId, request);

            return ResponseEntity.ok(updatedUser);

        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Token: User ID is not a number"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred"));
        }
    }

    @GetMapping("/ir-status")
    public ResponseEntity<List<IrStatusDto>> getIrStatus() {
        var statuses = userService.getIrStatuses();
        return ResponseEntity.ok(statuses);
    }

    @GetMapping("/{userId}/watchlist")
    public ResponseEntity<List<Integer>> getWatchlist(@PathVariable int userId) {
        return ResponseEntity.ok(userService.getWatchlist(userId));
    }

    @PostMapping("/{userId}/watchlist/add")
    public ResponseEntity<String> addToWatchlist(@PathVariable int userId, @RequestBody Map<String, Integer> body) {
        userService.addToWatchlist(userId, body.get("playerId"));
        return ResponseEntity.ok("Player added to watchlist");
    }

    @DeleteMapping("/{userId}/watchlist/remove")
    public ResponseEntity<String> removeFromWatchlist(@PathVariable int userId, @RequestBody Map<String, Integer> body) {
        userService.removeFromWatchlist(userId, body.get("playerId"));
        return ResponseEntity.ok("Player removed from watchlist");
    }
}
