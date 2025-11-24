//package com.fantasy.scheduler;
//
//import com.fantasy.application.FixtureService;
//import com.fantasy.application.PlayerService;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Component;
//
//@Component
//public class DataSyncScheduler {
//
//    private final PlayerService playerService;
//    private final FixtureService fixtureService;
//
//    public DataSyncScheduler(PlayerService playerService, FixtureService fixtureService) {
//        this.playerService = playerService;
//        this.fixtureService = fixtureService;
//    }
//
//    @Scheduled(cron = "0 0 */2 * * *")
//    public void syncGeneralData() {
//        System.out.println("Starting Periodic Data Sync...");
//
//        try {
//            playerService.refreshBasicPlayerData();
//            System.out.println("Players data synced.");
//        } catch (Exception e) {
//            System.err.println("Error syncing players: " + e.getMessage());
//        }
//
//        try {
//            fixtureService.loadFromApiAndSave();
//            System.out.println("Fixtures schedule synced.");
//        } catch (Exception e) {
//            System.err.println("Error syncing fixtures: " + e.getMessage());
//        }
//    }
//}