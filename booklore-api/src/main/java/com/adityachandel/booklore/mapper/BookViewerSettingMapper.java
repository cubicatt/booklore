package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.BookViewerSetting;
import com.adityachandel.booklore.model.entity.BookViewerSettingEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BookViewerSettingMapper {

    BookViewerSetting toBookViewerSetting(BookViewerSettingEntity entity);

}
