package edu.uth.eyewear_store.core.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    // Khóa bí mật (Trong thực tế nên lưu ở application.yml)
    private final String jwtSecret = "eyewearStoreSecretKeyForJwtAuthenticationVerySecure1234567890";
    private final int jwtExpirationMs = 86400000; // 1 ngày

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateJwtToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
}
