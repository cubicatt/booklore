package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.PdfViewerPreferences;
import com.adityachandel.booklore.model.entity.PdfViewerPreferencesEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PdfViewerPreferencesMapper {

    PdfViewerPreferences toModel(PdfViewerPreferencesEntity entity);

    PdfViewerPreferencesEntity toEntity(PdfViewerPreferences model);
}
