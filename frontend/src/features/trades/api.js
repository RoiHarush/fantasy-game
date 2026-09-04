import { apiRequest } from "../../services/apiClient";

export const fetchTradeContext = ({ signal } = {}) => apiRequest("/api/trades/context", { signal });
export const fetchTradeOffers = ({ signal } = {}) => apiRequest("/api/trades", { signal });

export const createTradeOffer = (payload) => apiRequest("/api/trades", {
    method: "POST",
    body: payload,
});

export const acceptTradeOffer = (offerId) => apiRequest(`/api/trades/${offerId}/accept`, { method: "POST" });
export const rejectTradeOffer = (offerId) => apiRequest(`/api/trades/${offerId}/reject`, { method: "POST" });
export const cancelTradeOffer = (offerId) => apiRequest(`/api/trades/${offerId}/cancel`, { method: "POST" });
