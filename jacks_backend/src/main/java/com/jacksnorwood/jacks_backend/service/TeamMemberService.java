package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.TeamMemberDTO;
import com.jacksnorwood.jacks_backend.entity.TeamMember;
import com.jacksnorwood.jacks_backend.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamMemberService {

    private final TeamMemberRepository repo;

    public List<TeamMemberDTO> getAll() {
        return repo.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TeamMemberDTO create(TeamMemberDTO dto) {
        TeamMember member = TeamMember.builder()
                .name(dto.getName())
                .position(dto.getPosition())
                .imageUrl(dto.getImageUrl())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .build();
        return toDTO(repo.save(member));
    }

    public TeamMemberDTO update(Long id, TeamMemberDTO dto) {
        TeamMember member = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Team member not found: " + id));
        if (dto.getName() != null)        member.setName(dto.getName());
        if (dto.getPosition() != null)    member.setPosition(dto.getPosition());
        if (dto.getImageUrl() != null)    member.setImageUrl(dto.getImageUrl());
        if (dto.getDisplayOrder() != null) member.setDisplayOrder(dto.getDisplayOrder());
        return toDTO(repo.save(member));
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private TeamMemberDTO toDTO(TeamMember m) {
        TeamMemberDTO dto = new TeamMemberDTO();
        dto.setId(m.getId());
        dto.setName(m.getName());
        dto.setPosition(m.getPosition());
        dto.setImageUrl(m.getImageUrl());
        dto.setDisplayOrder(m.getDisplayOrder());
        return dto;
    }
}
