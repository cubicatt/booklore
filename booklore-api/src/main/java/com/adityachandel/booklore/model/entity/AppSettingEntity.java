package com.adityachandel.booklore.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "app_settings")
@Data
public class AppSettingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "key1", nullable = false)
    private String key;

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value;
}
