package com.adityachandel.booklore.service.parser;

import com.adityachandel.booklore.entity.Book;

public interface BookParser {

    Book parseBook(String bookPath, String coverPath);

}
