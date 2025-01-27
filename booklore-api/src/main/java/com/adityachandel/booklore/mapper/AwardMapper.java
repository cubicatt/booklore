package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.Award;
import com.adityachandel.booklore.model.entity.BookAwardEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AwardMapper {
    Award toAward(BookAwardEntity awardEntity);
    List<Award> toAwardList(List<BookAwardEntity> awardEntities);
}
