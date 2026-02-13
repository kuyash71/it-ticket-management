package com.itsm.ticket.logging;

import org.apache.http.HttpHost;
import org.opensearch.client.RestClient;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.transport.rest_client.RestClientTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

@Configuration
public class OpenSearchConfig {

    @Bean
    public OpenSearchClient openSearchClient(@Value("${observability.opensearch.url}") String openSearchUrl) {
        URI uri = URI.create(openSearchUrl);
        RestClient restClient = RestClient.builder(new HttpHost(uri.getHost(), uri.getPort(), uri.getScheme())).build();
        OpenSearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
        return new OpenSearchClient(transport);
    }
}
