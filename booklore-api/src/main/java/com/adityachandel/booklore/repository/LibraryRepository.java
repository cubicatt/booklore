package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.entity.Library;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LibraryRepository extends JpaRepository<Library, Long>, JpaSpecificationExecutor<Library> {

    List<Library> findByName(String name);

}
