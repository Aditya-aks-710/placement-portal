package com.nit.placement_portal.controller;

import com.nit.placement_portal.model.PlacementRequest;
import com.nit.placement_portal.service.PlacementService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final PlacementService placementService;

    public AdminController(PlacementService placementService, HelloController helloController) {
        this.placementService = placementService;
    }

    @GetMapping("/placement-requests")
    public List<PlacementRequest> getRequestsByStatus(
        @RequestParam(defaultValue = "PENDING") String status) {
            return placementService.getRequestsByStatus(status);
    }

    @PutMapping("/placement-requests/{id}/approve")
    public PlacementRequest approvRequest(@PathVariable String id) {
        return placementService.approveRequest(id);
    }

    @PutMapping("/placement-requests/{id}/reject")
    public PlacementRequest rejectRequest(@PathVariable String id) {
        return placementService.rejectRequest(id);
    }
}