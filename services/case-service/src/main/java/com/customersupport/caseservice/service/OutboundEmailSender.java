package com.customersupport.caseservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** Sends outbound customer email via SMTP; logs only when disabled. */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboundEmailSender {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:no-reply@example.com}")
    private String from;

    @Value("${app.mail.from-name:Supportly Customer Support}")
    private String fromName;

    public void send(String to, List<String> cc, String subject, String body) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping outbound email — empty recipient (subject='{}')", subject);
            return;
        }
        if (!enabled) {
            log.info("[mail-disabled] would send to={} cc={} subject='{}'\n{}",
                     to, cc, subject, body);
            return;
        }

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, StandardCharsets.UTF_8.name());

            try {
                helper.setFrom(new InternetAddress(from, fromName));
            } catch (UnsupportedEncodingException uee) {
                helper.setFrom(from);
            }
            helper.setTo(to);
            if (cc != null && !cc.isEmpty()) {
                helper.setCc(cc.toArray(String[]::new));
            }
            helper.setSubject(subject == null || subject.isBlank() ? "(no subject)" : subject);
            helper.setText(body == null ? "" : body, false);

            mailSender.send(mime);
            log.info("Sent outbound email to={} cc={} subject='{}'", to, cc, subject);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send outbound email: " + e.getMessage(), e);
        }
    }
}
