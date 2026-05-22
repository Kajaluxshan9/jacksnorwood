package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findAllByOrderByDisplayOrderAsc();
}
