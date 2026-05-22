package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "site_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSettings {
    @Id
    @Column(length = 100)
    private String key;

    @Column(length = 500)
    private String value;
}
