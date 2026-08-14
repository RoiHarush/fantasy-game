package com.fantasy.domain.auth.mail;

public interface EmailDeliveryService {
    void send(OutboundEmail email);
}
