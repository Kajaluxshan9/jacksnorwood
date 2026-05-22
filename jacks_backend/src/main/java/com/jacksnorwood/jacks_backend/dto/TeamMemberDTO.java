package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;

@Data
public class TeamMemberDTO {
    private Long id;
    private String name;
    private String position;
    private String imageUrl;
    private Integer displayOrder;
}
