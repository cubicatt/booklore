package com.adityachandel.booklore.config;

import com.adityachandel.booklore.model.enums.MetadataProvider;
import com.adityachandel.booklore.service.metadata.parser.AmazonBookParser;
import com.adityachandel.booklore.service.metadata.parser.BookParser;
import com.adityachandel.booklore.service.metadata.parser.GoodReadsParser;
import com.adityachandel.booklore.service.metadata.parser.GoogleParser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class BookParserConfig {

    @Bean
    public Map<MetadataProvider, BookParser> parserMap(GoogleParser googleParser, AmazonBookParser amazonBookParser, GoodReadsParser goodReadsParser) {
        return Map.of(
                MetadataProvider.Amazon, amazonBookParser,
                MetadataProvider.GoodReads, goodReadsParser,
                MetadataProvider.Google, googleParser
        );
    }
}
