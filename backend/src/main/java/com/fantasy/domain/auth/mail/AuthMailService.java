package com.fantasy.domain.auth.mail;

import com.fantasy.domain.auth.AuthTokenService;
import com.fantasy.domain.user.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class AuthMailService {
    private final EmailDeliveryService deliveryService;
    private final String publicUrl;

    public AuthMailService(
            EmailDeliveryService deliveryService,
            @Value("${app.public-url:http://localhost:3000}") String publicUrl) {
        this.deliveryService = deliveryService;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
    }

    public void sendVerification(UserEntity user, AuthTokenService.IssuedToken token) {
        String url = publicUrl + "/verify-email?token=" + encode(token.value());
        sendLinkEmail(
                user,
                "Verify your Fantasy Draft email",
                "Verify email",
                "Welcome to Fantasy Draft. Confirm your email address to activate your account.",
                url,
                "verify-" + user.getId() + "-" + token.value().substring(0, 12)
        );
    }

    public void sendPasswordReset(UserEntity user, AuthTokenService.IssuedToken token) {
        String url = publicUrl + "/reset-password?token=" + encode(token.value());
        sendLinkEmail(
                user,
                "Reset your Fantasy Draft password",
                "Reset password",
                "A password reset was requested for your account. This link expires in 30 minutes.",
                url,
                "reset-" + user.getId() + "-" + token.value().substring(0, 12)
        );
    }

    private void sendLinkEmail(
            UserEntity user,
            String subject,
            String action,
            String introduction,
            String url,
            String idempotencyKey) {
        String safeName = HtmlUtils.htmlEscape(user.getFirstName() == null ? user.getUsername() : user.getFirstName());
        String safeUrl = HtmlUtils.htmlEscape(url);
        String html = """
                <!doctype html><html><body style=\"margin:0;background:#0d0718;color:#f7f3ff;font-family:Arial,sans-serif\">
                <div style=\"max-width:560px;margin:0 auto;padding:40px 24px\">
                  <div style=\"height:5px;border-radius:99px;background:linear-gradient(90deg,#12d9e8,#8c36ff)\"></div>
                  <h1 style=\"margin:30px 0 12px;font-size:28px\">Fantasy Draft</h1>
                  <p style=\"font-size:17px;line-height:1.6\">Hi %s,</p>
                  <p style=\"color:#c9bfd9;font-size:16px;line-height:1.65\">%s</p>
                  <p style=\"margin:30px 0\"><a href=\"%s\" style=\"display:inline-block;padding:14px 22px;border-radius:12px;background:linear-gradient(90deg,#12d9e8,#8c36ff);color:#130723;text-decoration:none;font-weight:800\">%s</a></p>
                  <p style=\"color:#9187a1;font-size:13px;line-height:1.5\">If you did not request this, you can safely ignore this email.</p>
                </div></body></html>
                """.formatted(safeName, HtmlUtils.htmlEscape(introduction), safeUrl, HtmlUtils.htmlEscape(action));
        String text = introduction + "\n\n" + action + ": " + url
                + "\n\nIf you did not request this, you can safely ignore this email.";
        deliveryService.send(new OutboundEmail(user.getEmail(), subject, html, text, idempotencyKey));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
