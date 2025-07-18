package com.fantasy.Draft;

import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerRepository;
import com.fantasy.User.User;

import java.time.LocalDateTime;
import java.util.List;

public class DraftController {

    private final DraftManager draftManager;
    private final DraftRoom draftRoom;

    public DraftController(DraftManager draftManager, DraftRoom draftRoom) {
        this.draftManager = draftManager;
        this.draftRoom = draftRoom;
    }


    public void startDraft(List<User> orderedUsers, PlayerRepository playersPoll) {
        draftManager.startDraft(draftRoom, orderedUsers, playersPoll);
        System.out.println("Draft started at: " + draftRoom.getStartAt());
    }

    public void pickPlayer(User user, Player playerIn, Player playerOutIfNeeded) {
        try {
            draftManager.makePick(draftRoom, user, playerIn, playerOutIfNeeded);
            System.out.println(user.getUsername() + " picked " + playerIn.getName());
        } catch (Exception e) {
            System.out.println("Pick failed for " + user.getUsername() + ": " + e.getMessage());
        }
    }

    public void endDraft() {
        draftRoom.setActive(false);
        draftRoom.setEndAt(LocalDateTime.now());
        System.out.println("Draft ended at: " + draftRoom.getEndAt());
    }
}
