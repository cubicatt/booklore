package com.adityachandel.booklore.service.metadata.parser;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dtonew.BookDTONew;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class AmazonBookParser implements BookParser {

    @Override
    public FetchedBookMetadata fetchTopMetadata(Book book, FetchMetadataRequest fetchMetadataRequest) {
        List<FetchedBookMetadata> fetchedBookMetadata = fetchTopNMetadata(book, fetchMetadataRequest, 1);
        if(fetchedBookMetadata == null || fetchedBookMetadata.isEmpty()) {
            return null;
        } else {
            return fetchedBookMetadata.getFirst();
        }
    }

    @Override
    public List<FetchedBookMetadata> fetchTopNMetadata(Book book, FetchMetadataRequest fetchMetadataRequest, int n) {
        if (fetchMetadataRequest == null || (fetchMetadataRequest.getTitle() == null && fetchMetadataRequest.getAuthor() == null && fetchMetadataRequest.getIsbn() == null)) {
            String title = book.getMetadata().getTitle();
            if (title == null || title.isEmpty()) {
                String cleanFileName = BookUtils.cleanFileName(book.getFileName());
                fetchMetadataRequest = FetchMetadataRequest.builder().title(cleanFileName).build();
            } else {
                fetchMetadataRequest = FetchMetadataRequest.builder().title(title).build();
            }
        }
        List<String> amazonBookIds = getFirstNAmazonBookIds(fetchMetadataRequest, n);
        if (amazonBookIds == null || amazonBookIds.isEmpty()) {
            return null;
        }
        List<FetchedBookMetadata> fetchedBookMetadata = new ArrayList<>();
        for (String amazonBookId : amazonBookIds) {
            fetchedBookMetadata.add(getBookMetadata(amazonBookId));
        }
        return fetchedBookMetadata;
    }

    private List<String> getFirstNAmazonBookIds(FetchMetadataRequest fetchMetadataRequest, int n) {
        String queryUrl = buildQueryUrl(fetchMetadataRequest);
        if (queryUrl == null) {
            log.error("Query URL is null, cannot proceed.");
            return null;
        }
        List<String> bookIds = new ArrayList<>();
        try {
            Document doc = fetchDoc(queryUrl);
            Element searchResults = doc.select("span[data-component-type=s-search-results]").first();
            if (searchResults == null) {
                log.error("No search results found for query: {}", queryUrl);
                return null;
            }
            Elements items = searchResults.select("div[role=listitem][data-index]");
            if (items.isEmpty()) {
                log.error("No items found in the search results.");
            } else {
                int count = 0;
                for (Element item : items) {
                    if (count >= n) break;
                    bookIds.add(extractAmazonBookId(item));
                    count++;
                }
            }
        } catch (Exception e) {
            log.error("Failed to get asin: {}", e.getMessage(), e);
        }
        return bookIds;
    }

    private String extractAmazonBookId(Element item) {
        String bookLink = null;
        for (String type : new String[]{"Paperback", "Hardcover"}) {
            Element link = item.select("a:containsOwn(" + type + ")").first();
            if (link != null) {
                bookLink = link.attr("href");
                log.info("{} link found: {}", type, bookLink);
                break; // Take the first found link, whether Paperback or Hardcover
            } else {
                log.info("No link containing '{}' found.", type);
            }
        }
        if (bookLink != null) {
            return extractAsinFromUrl(bookLink);
        } else {
            String asin = item.attr("data-asin");
            log.info("No book link found, returning ASIN: {}", asin);
            return asin;
        }
    }

    private String extractAsinFromUrl(String url) {
        // Extract the ASIN (book ID) from the URL, which will be the part after "/dp/"
        String[] parts = url.split("/dp/");
        if (parts.length > 1) {
            String[] asinParts = parts[1].split("/");
            return asinParts[0];
        }
        return null;
    }

    private FetchedBookMetadata getBookMetadata(String amazonBookId) {
        log.info("Fetching book metadata for amazon book {}", amazonBookId);

        Document doc = fetchDoc("https://www.amazon.com/dp/" + amazonBookId);

        return FetchedBookMetadata.builder()
                .title(getTitle(doc))
                .subtitle(getSubtitle(doc))
                .authors(getAuthors(doc).stream().toList())
                .categories(getBestSellerCategories(doc).stream().toList())
                .description(getDescription(doc))
                .isbn13(getIsbn13(doc))
                .isbn10(getIsbn10(doc))
                .publisher(getPublisher(doc))
                .publishedDate(getPublicationDate(doc))
                .language(getLanguage(doc))
                .pageCount(getPageCount(doc))
                .thumbnailUrl(getThumbnail(doc))
                .rating(getRating(doc))
                .reviewCount(getReviewCount(doc))
                .build();
    }

    private String buildQueryUrl(FetchMetadataRequest fetchMetadataRequest) {
        StringBuilder queryBuilder = new StringBuilder("https://www.amazon.com/s/?search-alias=stripbooks&unfiltered=1&sort=relevanceexprank");

        if (fetchMetadataRequest.getIsbn() != null && !fetchMetadataRequest.getIsbn().isEmpty()) {
            queryBuilder.append("&field-isbn=").append(fetchMetadataRequest.getIsbn());
        }

        if (fetchMetadataRequest.getTitle() != null && !fetchMetadataRequest.getTitle().isEmpty()) {
            queryBuilder.append("&field-title=").append(fetchMetadataRequest.getTitle().replace(" ", "%20"));
        }

        if (fetchMetadataRequest.getAuthor() != null && !fetchMetadataRequest.getAuthor().isEmpty()) {
            queryBuilder.append("&field-author=").append(fetchMetadataRequest.getAuthor().replace(" ", "%20"));
        }

        if (fetchMetadataRequest.getIsbn() == null && fetchMetadataRequest.getTitle() == null && fetchMetadataRequest.getAuthor() != null) {
            return null;
        }

        log.info("Query URL: {}", queryBuilder.toString());
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
        log.warn("Error fetching subtitle: Element not found.");
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
            log.warn("Error fetching ISBN-10: Element not found.");
        } catch (Exception e) {
            log.warn("Error fetching ISBN-10: {}", e.getMessage());
        }
        return null;
    }

    private String getIsbn13(Document doc) {
        try {
            Element isbn13Element = doc.select("#rpi-attribute-book_details-isbn13 .rpi-attribute-value span").first();
            if (isbn13Element != null) {
                return isbn13Element.text();
            }
            log.warn("Error fetching ISBN-13: Element not found.");
        } catch (Exception e) {
            log.warn("Error fetching ISBN-13: {}", e.getMessage());
        }
        return null;
    }

    private String getPublisher(Document doc) {
        try {
            Element publisherElement = doc.select("#rpi-attribute-book_details-publisher .rpi-attribute-value span").first();
            if (publisherElement != null) {
                return publisherElement.text();
            }
            log.warn("Error fetching publisher: Element not found.");
        } catch (Exception e) {
            log.warn("Error fetching publisher: {}", e.getMessage());
        }
        return null;
    }

    private LocalDate getPublicationDate(Document doc) {
        try {
            Element publicationDateElement = doc.select("#rpi-attribute-book_details-publication_date .rpi-attribute-value span").first();
            if (publicationDateElement != null) {
                return parseAmazonDate(publicationDateElement.text());
            }
            log.warn("Error fetching publication date: Element not found.");
        } catch (Exception e) {
            log.warn("Error fetching publication date: {}", e.getMessage());
        }
        return null;
    }

    private String getLanguage(Document doc) {
        try {
            Element languageElement = doc.select("#rpi-attribute-language .rpi-attribute-value span").first();
            if (languageElement != null) {
                return languageElement.text();
            }
            log.warn("Error fetching language: Element not found.");
        } catch (Exception e) {
            log.warn("Error fetching language: {}", e.getMessage());
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
            log.warn("Error fetching best seller categories: Element not found.");
        } catch (Exception e) {
            log.warn("Error fetching best seller categories: {}", e.getMessage());
        }
        return Set.of();
    }

    private Float getRating(Document doc) {
        try {
            Element reviewDiv = doc.select("div#averageCustomerReviews_feature_div").first();
            if (reviewDiv != null) {
                Elements ratingElements = reviewDiv.select("span#acrPopover span.a-size-base.a-color-base");
                if (!ratingElements.isEmpty()) {
                    String text = Objects.requireNonNull(ratingElements.first()).text();
                    if (!text.isEmpty()) {
                        return Float.parseFloat(text);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error fetching rating", e);
        }
        return null;
    }

    private Integer getReviewCount(Document doc) {
        try {
            Element reviewDiv = doc.select("div#averageCustomerReviews_feature_div").first();
            if (reviewDiv != null) {
                Element reviewCountElement = reviewDiv.getElementById("acrCustomerReviewText");
                if (reviewCountElement != null) {
                    String reviewCount = Objects.requireNonNull(reviewCountElement).text().split(" ")[0];
                    if (!reviewCount.isEmpty()) {
                        reviewCount = reviewCount.replace(",", "");
                        return Integer.parseInt(reviewCount);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error fetching review count", e);
        }
        return null;
    }

    private String getThumbnail(Document doc) {
        try {
            Element imageElement = doc.select("#landingImage").first();
            if (imageElement != null) {
                return imageElement.attr("src");
            }
            log.warn("Error fetching image URL: Image element not found.");
        } catch (Exception e) {
            log.warn("Error fetching image URL: {}", e.getMessage());
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
                    log.warn("Error parsing page count: {}", pageCountText, e);
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

    private LocalDate parseAmazonDate(String dateString) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM d, yyyy");
        return LocalDate.parse(dateString, formatter);
    }
}