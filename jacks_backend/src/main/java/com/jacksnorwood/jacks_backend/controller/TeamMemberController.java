package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.TeamMemberDTO;
import com.jacksnorwood.jacks_backend.service.TeamMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
public class TeamMemberController {

    private final TeamMemberService teamMemberService;

    @GetMapping
    public ResponseEntity<List<TeamMemberDTO>> getAll() {
        return ResponseEntity.ok(teamMemberService.getAll());
    }

    @PostMapping
    public ResponseEntity<TeamMemberDTO> create(@RequestBody TeamMemberDTO dto) {
        return ResponseEntity.ok(teamMemberService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamMemberDTO> update(@PathVariable Long id, @RequestBody TeamMemberDTO dto) {
        return ResponseEntity.ok(teamMemberService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        teamMemberService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
