package com.fantasy.domain.transfer;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class TransferMarketControllerAuthorizationTest {

    @Test
    void transferUsesAuthenticatedUserInsteadOfRequestUser() {
        TransferMarketService service = mock(TransferMarketService.class);
        TransferMarketController controller = new TransferMarketController(service);
        TransferRequestDto request = new TransferRequestDto();
        request.setUserId(999);

        controller.makeTransfer(
                request,
                new UsernamePasswordAuthenticationToken("42", null)
        );

        verify(service).processTransfer(request);
        org.junit.jupiter.api.Assertions.assertEquals(42, request.getUserId());
    }

    @Test
    void passTurnUsesAuthenticatedUserInsteadOfQueryParameter() {
        TransferMarketService service = mock(TransferMarketService.class);
        TransferMarketController controller = new TransferMarketController(service);

        controller.passTurn(
                999,
                new UsernamePasswordAuthenticationToken("42", null)
        );

        verify(service).passTurn(42);
    }
}
