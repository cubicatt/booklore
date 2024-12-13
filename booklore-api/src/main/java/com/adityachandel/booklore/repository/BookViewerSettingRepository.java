package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.entity.BookViewerSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookViewerSettingRepository extends JpaRepository<BookViewerSetting, Long> {

}
