package com.shadow.platform.comparison.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Fetches actual response bodies from production and shadow backends
 * by replaying the original request. This is needed because NGINX mirror
 * only forwards the client's request body, not the upstream response body.
 */
@Service
public class ResponseFetcher {

    private static final Logger log = LoggerFactory.getLogger(ResponseFetcher.class);

    private final HttpClient httpClient;
    private final String prodBaseUrl;
    private final String shadowBaseUrl;

    public ResponseFetcher(
            @Value("${shadow.backends.prod-host:host.docker.internal}") String prodHost,
            @Value("${shadow.backends.prod-port:3000}") int prodPort,
            @Value("${shadow.backends.shadow-host:host.docker.internal}") String shadowHost,
            @Value("${shadow.backends.shadow-port:4000}") int shadowPort) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.prodBaseUrl = "http://" + prodHost + ":" + prodPort;
        this.shadowBaseUrl = "http://" + shadowHost + ":" + shadowPort;
        log.info("ResponseFetcher initialized [prod={}, shadow={}]", prodBaseUrl, shadowBaseUrl);
    }

    /**
     * Fetch response from the production backend.
     */
    public FetchResult fetchProd(String endpoint, String method) {
        return fetch(prodBaseUrl, endpoint, method, "production");
    }

    /**
     * Fetch response from the shadow backend.
     */
    public FetchResult fetchShadow(String endpoint, String method) {
        return fetch(shadowBaseUrl, endpoint, method, "shadow");
    }

    private FetchResult fetch(String baseUrl, String endpoint, String method, String label) {
        try {
            String url = baseUrl + endpoint;
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json");

            if ("GET".equalsIgnoreCase(method)) {
                reqBuilder.GET();
            } else if ("POST".equalsIgnoreCase(method)) {
                reqBuilder.POST(HttpRequest.BodyPublishers.noBody());
            } else {
                reqBuilder.GET(); // default to GET
            }

            HttpResponse<String> response = httpClient.send(reqBuilder.build(),
                    HttpResponse.BodyHandlers.ofString());

            String body = response.body() != null ? response.body() : "";
            log.debug("Fetched {} response [endpoint={}, status={}, bodyLen={}]",
                    label, endpoint, response.statusCode(), body.length());

            return new FetchResult(body, response.statusCode());
        } catch (Exception e) {
            log.warn("Failed to fetch {} response [endpoint={}]: ", label, endpoint, e);
            return null;
        }
    }

    public record FetchResult(String body, int statusCode) {}
}
