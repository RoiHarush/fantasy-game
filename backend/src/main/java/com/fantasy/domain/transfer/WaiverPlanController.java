package com.fantasy.domain.transfer;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/waivers")
public class WaiverPlanController {

    private final WaiverPlanService waiverPlanService;

    public WaiverPlanController(WaiverPlanService waiverPlanService) {
        this.waiverPlanService = waiverPlanService;
    }

    @PutMapping("/{gameWeekId}")
    public ResponseEntity<List<WaiverEntryDto>> savePlan(@PathVariable int gameWeekId,
                                                         @RequestBody SaveWaiverPlanRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.ok(waiverPlanService.savePlan(userId(authentication), gameWeekId, request));
    }

    @GetMapping("/{gameWeekId}")
    public ResponseEntity<List<WaiverEntryDto>> getPlan(@PathVariable int gameWeekId,
                                                        Authentication authentication) {
        return ResponseEntity.ok(waiverPlanService.getPlan(userId(authentication), gameWeekId));
    }

    @DeleteMapping("/{gameWeekId}")
    public ResponseEntity<Void> deletePlan(@PathVariable int gameWeekId,
                                           Authentication authentication) {
        waiverPlanService.deletePlan(userId(authentication), gameWeekId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{gameWeekId}/ir")
    public ResponseEntity<List<WaiverEntryDto>> saveIrPlan(@PathVariable int gameWeekId,
                                                           @RequestBody SaveWaiverPlanRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(waiverPlanService.saveIrPlan(userId(authentication), gameWeekId, request));
    }

    @GetMapping("/{gameWeekId}/ir")
    public ResponseEntity<List<WaiverEntryDto>> getIrPlan(@PathVariable int gameWeekId,
                                                          Authentication authentication) {
        return ResponseEntity.ok(waiverPlanService.getIrPlan(userId(authentication), gameWeekId));
    }

    @DeleteMapping("/{gameWeekId}/ir")
    public ResponseEntity<Void> deleteIrPlan(@PathVariable int gameWeekId,
                                             Authentication authentication) {
        waiverPlanService.deleteIrPlan(userId(authentication), gameWeekId);
        return ResponseEntity.noContent().build();
    }

    private int userId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
