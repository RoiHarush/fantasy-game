package com.fantasy.domain.transfer;

import java.util.List;

public record SaveWaiverPlanRequest(List<WaiverEntryRequest> entries) {}
