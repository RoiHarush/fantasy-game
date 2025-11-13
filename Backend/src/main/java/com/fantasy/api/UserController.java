package com.fantasy.api;

import com.fantasy.dto.IrStatusDto;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UserDto;
import com.fantasy.application.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
