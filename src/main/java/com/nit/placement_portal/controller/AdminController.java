package com.nit.placement_portal.controller;

import com.nit.placement_portal.model.PlacementRequest;
import com.nit.placement_portal.service.PlacementService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final PlacementService placementService;

    public AdminController(PlacementService placementService) {
        this.placementService = placementService;
    }

    @GetMapping("/placement-requests")
    public List<PlacementRequest> getRequestsByStatus(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String campusMode,
        @RequestParam(required = false) String placementNature ) {

            if(status != null) {
                return placementService.getRequestsByStatus(status);
            }

            if(campusMode != null) {
                return placementService.getRequestsByCampusMode(campusMode);
            }

            if(placementNature != null) {
                return placementService.getRequestsByPlacementNature(placementNature);
            }

            return placementService.getRequestsByStatus("PENDING");
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