package com.fantasy.domain.trade;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import static com.fantasy.domain.trade.TradeDtos.*;

@RestController
@RequestMapping("/api/trades")
public class TradeController {
    private final TradeService tradeService;

    public TradeController(TradeService tradeService) { this.tradeService = tradeService; }

    @GetMapping("/context")
    public ResponseEntity<TradeContext> context(Authentication authentication) {
        return ResponseEntity.ok(tradeService.context(userId(authentication)));
    }

    @GetMapping
    public ResponseEntity<TradeOffers> offers(Authentication authentication) {
        return ResponseEntity.ok(tradeService.offers(userId(authentication)));
    }

    @PostMapping
    public ResponseEntity<TradeOffer> create(@RequestBody CreateTradeOfferRequest request,
                                             Authentication authentication) {
        return ResponseEntity.status(201).body(tradeService.create(userId(authentication), request));
    }

    @PostMapping("/{offerId}/accept")
    public ResponseEntity<TradeOffer> accept(@PathVariable long offerId, Authentication authentication) {
        return ResponseEntity.ok(tradeService.accept(userId(authentication), offerId));
    }

    @PostMapping("/{offerId}/reject")
    public ResponseEntity<TradeOffer> reject(@PathVariable long offerId, Authentication authentication) {
        return ResponseEntity.ok(tradeService.reject(userId(authentication), offerId));
    }

    @PostMapping("/{offerId}/cancel")
    public ResponseEntity<TradeOffer> cancel(@PathVariable long offerId, Authentication authentication) {
        return ResponseEntity.ok(tradeService.cancel(userId(authentication), offerId));
    }

    private int userId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
