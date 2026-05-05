package edu.uth.eyewear_store.core.service;

import edu.uth.eyewear_store.core.entity.SystemAuditLog;
import edu.uth.eyewear_store.core.repository.SystemAuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    @Autowired
    private SystemAuditLogRepository auditLogRepository;

    public void logAction(String action, String entityName, String entityId, String details) {
        String username = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            username = auth.getName();
        }

        SystemAuditLog log = SystemAuditLog.builder()
                .username(username)
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .details(details)
                .build();

        auditLogRepository.save(log);
    }
}