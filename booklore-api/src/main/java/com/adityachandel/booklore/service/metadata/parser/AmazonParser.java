package com.adityachandel.booklore.service.metadata.parser;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.AuthorDTO;
import com.adityachandel.booklore.model.dto.BookMetadataDTO;
import com.adityachandel.booklore.model.dto.CategoryDTO;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.Library;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.service.metadata.parser.model.QueryData;
import com.adityachandel.booklore.util.BookUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class AmazonParser {

    private BookRepository bookRepository;

    public BookMetadataDTO queryForBookMetadata(Long bookId, QueryData queryData) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        if (queryData == null || (queryData.getBookTitle() == null && queryData.getAuthor() == null && queryData.getIsbn() == null)) {
            String title = book.getMetadata().getTitle();
            if (title == null || title.isEmpty()) {
                String cleanFileName = BookUtils.cleanFileName(book.getFileName());
                queryData = QueryData.builder().bookTitle(cleanFileName).build();
            } else {
                queryData = QueryData.builder().bookTitle(title).build();
            }
        }
        String amazonBookId = getAmazonBookId(queryData);
        if (amazonBookId == null) {
            return null;
        }
        return getBookMetadata(amazonBookId);
    }

    public String getAmazonBookId(QueryData queryData) {
        String queryUrl = buildQueryUrl(queryData);
        if (queryUrl == null) {
            return null;
        }

        try {
            Document doc = fetchDoc(queryUrl);
            Element searchResults = doc.select("span[data-component-type=s-search-results]").first();
            Element item = searchResults.select("div[role=listitem][data-index=2]").first();
            return item.attr("data-asin");
        } catch (Exception e) {
            log.error("Failed to get asin: {}", e.getMessage());
            return null;
        }
    }

    public BookMetadataDTO getBookMetadata(String amazonBookId) {

        Document doc = fetchDoc("https://www.amazon.com/dp/" + amazonBookId);

        return BookMetadataDTO.builder()
                .amazonBookId(amazonBookId)
                .title(getTitle(doc))
                .subtitle(getSubtitle(doc))
                .authors(getAuthors(doc).stream()
                        .map(name -> AuthorDTO.builder().name(name).build())
                        .collect(Collectors.toList()))
                .categories(getBestSellerCategories(doc).stream()
                        .map(category -> CategoryDTO.builder().name(category).build())
                        .collect(Collectors.toList()))
                .description(getDescription(doc))
                .isbn13(getIsbn13(doc))
                .isbn10(getIsbn10(doc))
                .publisher(getPublisher(doc))
                .publishedDate(getPublicationDate(doc))
                .language(getLanguage(doc))
                .pageCount(getPageCount(doc))
                .thumbnail(getThumbnail(doc))
                .rating(getRating(doc))
                .reviewCount(getReviewCount(doc))
                .printLength(getPrintLength(doc))
                .build();
    }

    private String buildQueryUrl(QueryData queryData) {
        StringBuilder queryBuilder = new StringBuilder("https://www.amazon.com/s/?search-alias=stripbooks&unfiltered=1&sort=relevanceexprank");

        if (queryData.getIsbn() != null && !queryData.getIsbn().isEmpty()) {
            queryBuilder.append("&field-isbn=").append(queryData.getIsbn());
        }

        if (queryData.getBookTitle() != null && !queryData.getBookTitle().isEmpty()) {
            queryBuilder.append("&field-title=").append(queryData.getBookTitle().replace(" ", "%20"));
        }

        if (queryData.getAuthor() != null && !queryData.getAuthor().isEmpty()) {
            queryBuilder.append("&field-author=").append(queryData.getAuthor().replace(" ", "%20"));
        }

        if (queryData.getIsbn() == null && queryData.getBookTitle() == null && queryData.getAuthor() != null) {
            return null;
        }

        return queryBuilder.toString();
    }

    private String getTitle(Document doc) {
        Element titleElement = doc.getElementById("productTitle");
        if (titleElement != null) {
            return titleElement.text();
        }
        log.error("Error fetching title: Element not found.");
        return null;
    }

    private String getSubtitle(Document doc) {
        Element subtitleElement = doc.getElementById("productSubtitle");
        if (subtitleElement != null) {
            return subtitleElement.text();
        }
        log.error("Error fetching subtitle: Element not found.");
        return null;
    }

    private Set<String> getAuthors(Document doc) {
        try {
            Element bylineDiv = doc.select("#bylineInfo_feature_div").first();
            if (bylineDiv != null) {
                return bylineDiv
                        .select(".author a")
                        .stream()
                        .map(Element::text)
                        .collect(Collectors.toSet());
            }
            log.error("Error fetching authors: Byline element not found.");
        } catch (Exception e) {
            log.error("Error fetching authors: {}", e.getMessage());
        }
        return Set.of();
    }

    private String getDescription(Document doc) {
        try {
            Elements descriptionElements = doc.select("[data-a-expander-name=book_description_expander] .a-expander-content");
            if (!descriptionElements.isEmpty()) {
                String html = descriptionElements.getFirst().html();
                html = html.replace("\n", "<br>");
                return html;
            }
            return null;
        } catch (Exception e) {
            log.error("Error extracting description from the document", e);
        }
        return null;
    }

    private String getIsbn10(Document doc) {
        try {
            Element isbn10Element = doc.select("#rpi-attribute-book_details-isbn10 .rpi-attribute-value span").first();
            if (isbn10Element != null) {
                return isbn10Element.text();
            }
            log.error("Error fetching ISBN-10: Element not found.");
        } catch (Exception e) {
            log.error("Error fetching ISBN-10: {}", e.getMessage());
        }
        return null;
    }

    private String getIsbn13(Document doc) {
        try {
            Element isbn13Element = doc.select("#rpi-attribute-book_details-isbn13 .rpi-attribute-value span").first();
            if (isbn13Element != null) {
                return isbn13Element.text();
            }
            log.error("Error fetching ISBN-13: Element not found.");
        } catch (Exception e) {
            log.error("Error fetching ISBN-13: {}", e.getMessage());
        }
        return null;
    }

    private String getPublisher(Document doc) {
        try {
            Element publisherElement = doc.select("#rpi-attribute-book_details-publisher .rpi-attribute-value span").first();
            if (publisherElement != null) {
                return publisherElement.text();
            }
            log.error("Error fetching publisher: Element not found.");
        } catch (Exception e) {
            log.error("Error fetching publisher: {}", e.getMessage());
        }
        return null;
    }

    private String getPublicationDate(Document doc) {
        try {
            Element publicationDateElement = doc.select("#rpi-attribute-book_details-publication_date .rpi-attribute-value span").first();
            if (publicationDateElement != null) {
                return publicationDateElement.text();
            }
            log.error("Error fetching publication date: Element not found.");
        } catch (Exception e) {
            log.error("Error fetching publication date: {}", e.getMessage());
        }
        return null;
    }

    private String getLanguage(Document doc) {
        try {
            Element languageElement = doc.select("#rpi-attribute-language .rpi-attribute-value span").first();
            if (languageElement != null) {
                return languageElement.text();
            }
            log.error("Error fetching language: Element not found.");
        } catch (Exception e) {
            log.error("Error fetching language: {}", e.getMessage());
        }
        return null;
    }

    private String getPrintLength(Document doc) {
        try {
            Element printLengthElement = doc.select("#rpi-attribute-book_details-fiona_pages .rpi-attribute-value span").first();
            if (printLengthElement != null) {
                return printLengthElement.text();
            }
            log.error("Error fetching print length: Element not found.");
        } catch (Exception e) {
            log.error("Error fetching print length: {}", e.getMessage());
        }
        return null;
    }

    private Set<String> getBestSellerCategories(Document doc) {
        try {
            Element bestSellerCategoriesElement = doc.select("#detailBullets_feature_div").first();
            if (bestSellerCategoriesElement != null) {
                return bestSellerCategoriesElement
                        .select(".zg_hrsr .a-list-item a")
                        .stream()
                        .map(Element::text)
                        .map(c -> c.replace("(Books)", "").trim())
                        .collect(Collectors.toSet());
            }
            log.error("Error fetching best seller categories: Element not found.");
        } catch (Exception e) {
            log.error("Error fetching best seller categories: {}", e.getMessage());
        }
        return Set.of();
    }

    private String getRating(Document doc) {
        try {
            Element reviewDiv = doc.select("div#averageCustomerReviews_feature_div").first();
            if (reviewDiv != null) {
                Elements ratingElements = reviewDiv.select("span#acrPopover span.a-size-base.a-color-base");
                if (!ratingElements.isEmpty()) {
                    return Objects.requireNonNull(ratingElements.first()).text();
                }
            }
        } catch (Exception e) {
            log.error("Error fetching rating", e);
        }
        return null;
    }

    private String getReviewCount(Document doc) {
        try {
            Element reviewDiv = doc.select("div#averageCustomerReviews_feature_div").first();
            if (reviewDiv != null) {
                Element reviewCountElement = reviewDiv.getElementById("acrCustomerReviewText");
                if (reviewCountElement != null) {
                    return Objects.requireNonNull(reviewCountElement).text().split(" ")[0];
                }
            }
        } catch (Exception e) {
            log.error("Error fetching review count", e);
        }
        return null;
    }

    private String getThumbnail(Document doc) {
        try {
            Element imageElement = doc.select("#landingImage").first();
            if (imageElement != null) {
                return imageElement.attr("src");
            }
            log.error("Error fetching image URL: Image element not found.");
        } catch (Exception e) {
            log.error("Error fetching image URL: {}", e.getMessage());
        }
        return null;
    }

    private Integer getPageCount(Document doc) {
        Elements pageCountElements = doc.select("#rpi-attribute-book_details-fiona_pages .rpi-attribute-value span");
        if (!pageCountElements.isEmpty()) {
            String pageCountText = pageCountElements.first().text();
            if (!pageCountText.isEmpty()) {
                try {
                    String cleanedPageCount = pageCountText.replaceAll("[^\\d]", "");
                    return Integer.parseInt(cleanedPageCount);
                } catch (NumberFormatException e) {
                    log.error("Error parsing page count: {}", pageCountText, e);
                }
            }
        }
        return null;
    }

    private Document fetchDoc(String url) {
        try {
            Connection.Response response = Jsoup.connect(url)
                    .header("accept", "text/html, application/json")
                    .header("accept-language", "en-US,en;q=0.9")
                    .header("content-type", "application/json")
                    .header("device-memory", "8")
                    .header("downlink", "10")
                    .header("dpr", "2")
                    .header("ect", "4g")
                    .header("origin", "https://www.amazon.com")
                    .header("priority", "u=1, i")
                    .header("rtt", "50")
                    .header("sec-ch-device-memory", "8")
                    .header("sec-ch-dpr", "2")
                    .header("sec-ch-ua", "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"")
                    .header("sec-ch-ua-mobile", "?0")
                    .header("sec-ch-ua-platform", "\"macOS\"")
                    .header("sec-ch-viewport-width", "1170")
                    .header("sec-fetch-dest", "empty")
                    .header("sec-fetch-mode", "cors")
                    .header("sec-fetch-site", "same-origin")
                    .header("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
                    .header("viewport-width", "1170")
                    .header("x-amz-amabot-click-attributes", "disable")
                    .header("x-requested-with", "XMLHttpRequest")
                    .method(Connection.Method.GET)
                    .execute();
            return response.parse();
        } catch (IOException e) {
            log.error("Error parsing url: {}", url, e);
            throw new RuntimeException(e);
        }
    }
}