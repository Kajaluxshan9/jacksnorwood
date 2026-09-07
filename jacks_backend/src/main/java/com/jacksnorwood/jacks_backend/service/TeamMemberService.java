package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.TeamMemberDTO;
import com.jacksnorwood.jacks_backend.entity.TeamMember;
import com.jacksnorwood.jacks_backend.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamMemberService {

    private final TeamMemberRepository repo;
    private final FileStorageService fileStorage;

    public List<TeamMemberDTO> getAll() {
        return repo.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TeamMemberDTO create(TeamMemberDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new BadRequestException("Name is required");
        }
        if (dto.getPosition() == null || dto.getPosition().isBlank()) {
            throw new BadRequestException("Position is required");
        }
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
                .orElseThrow(() -> ResourceNotFoundException.of("Team member", id));
        if (dto.getName() != null)        member.setName(dto.getName());
        if (dto.getPosition() != null)    member.setPosition(dto.getPosition());
        if (dto.getImageUrl() != null) {
            String next = dto.getImageUrl().isBlank() ? null : dto.getImageUrl();
            if (member.getImageUrl() != null && !member.getImageUrl().equals(next)) {
                fileStorage.deleteQuietly(member.getImageUrl());
            }
            member.setImageUrl(next);
        }
        if (dto.getDisplayOrder() != null) member.setDisplayOrder(dto.getDisplayOrder());
        return toDTO(repo.save(member));
    }

    public void delete(Long id) {
        TeamMember member = repo.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Team member", id));
        fileStorage.deleteQuietly(member.getImageUrl());
        repo.delete(member);
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
