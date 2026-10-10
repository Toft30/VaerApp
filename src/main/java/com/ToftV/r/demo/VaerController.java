package com.ToftV.r.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "http://localhost:5173")
public class VaerController {

    private final RestClient restClient = RestClient.create();

    @GetMapping
    public Map getVaer(@RequestParam String by) {
        // UriComponentsBuilder handterer mellomrom og æ, ø, å automatisk
        URI uri = UriComponentsBuilder
                .fromUriString("https://geocoding-api.open-meteo.com/v1/search")
                .queryParam("name", by)
                .queryParam("count", 1)
                .queryParam("language", "no")
                .queryParam("format", "json")
                .build()
                .encode()
                .toUri();
        Map geoResponse = restClient.get()
                .uri(uri)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> result =  (List<Map<String, Object>>) geoResponse.get("results");
        if(result == null || result.isEmpty()) {
            return Map.of("erreor", "Hallo, ikkje finn på plassa: " + by);
        }

        Map<String, Object> plass = result.get(0);
        Object lat = plass.get("latitude");
        Object lon = plass.get("longitude");
        String plassnamn = (String) plass.get("name");
        String land = (String) plass.get("country");

        URI vaerUri = UriComponentsBuilder
                .fromUriString("https://api.open-meteo.com/v1/forecast")
                .queryParam("latitude", lat)
                .queryParam("longitude", lon)
                .queryParam("current", "temperature_2m,wind_speed_10m,weather_code")
                .build()
                .toUri();

        Map vaerResponse = restClient.get()
                .uri(vaerUri)
                .retrieve()
                .body(Map.class);

        Map<String, Object> current = (Map<String, Object>) vaerResponse.get("current");

        return Map.of(
                "by", plassnamn,
                "land", land != null ? land : "",
                "temperatur", current.get("temperature_2m"),
                "vind", current.get("wind_speed_10m"),
                "weatherCode",  current.get("weather_code")
        );
    }
}
