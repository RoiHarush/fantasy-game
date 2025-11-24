package com.fantasy.domain.transfer;

import java.util.*;

public class TransferTurnManager {

    private final Queue<Integer> order;
    private final Queue<Integer> eligibleIR;
    private final List<Integer> initialOrder;

    private boolean windowOpen = false;
    private enum RoundType {REGULAR, IR}
    private RoundType currentRound = RoundType.REGULAR;

    private final Map<Integer, Integer> turnsUsed = new HashMap<>();

    private final Map<Integer, Integer> userTotalTurns = new HashMap<>();


    public TransferTurnManager(List<TransferPickEntity> order, List<Integer> eligibleIR) {
        if (order == null || order.isEmpty())
            throw new IllegalArgumentException("Transfer order cannot be null or empty");

        this.order = buildQueue(order);
        this.eligibleIR = buildQueue(eligibleIR);

        Set<Integer> uniqueIds = new LinkedHashSet<>();
        for (TransferPickEntity pick : order) {
            uniqueIds.add(pick.getUserId());
            userTotalTurns.merge(pick.getUserId(), 1, Integer::sum);
        }
        this.initialOrder = new ArrayList<>(uniqueIds);

        for (Integer userId : uniqueIds) {
            turnsUsed.put(userId, 0);
        }
    }

    public <T> Queue<Integer> buildQueue(List<T> order) {
        Queue<Integer> result = new ArrayDeque<>();
        for (T element : order) {
            if (element instanceof TransferPickEntity entity)
                result.offer(entity.getUserId());
            else if (element instanceof Integer id)
                result.offer(id);
        }
        return result;
    }

    public void startWindow() {
        if (windowOpen) throw new IllegalStateException("Transfer window already open");
        windowOpen = true;
        currentRound = RoundType.REGULAR;
        System.out.println("🪟 Transfer window started");
    }

    public void endTurn() {
        if (!windowOpen) throw new IllegalStateException("Transfer window not open");

        Integer finishedUser = order.poll();
        if (finishedUser != null)
            turnsUsed.merge(finishedUser, 1, Integer::sum);

        if (this.order.isEmpty()) {
            if (!currentRound.equals(RoundType.IR)) {
                startIRRound();
            } else {
                closeWindow();
            }
        }
    }

    private void startIRRound() {
        currentRound = RoundType.IR;
        order.clear();
        order.addAll(eligibleIR);

        System.out.println("⚕️ Starting IR round");
    }

    public void closeWindow() {
        windowOpen = false;
        System.out.println("🏁 Transfer window closed");
    }

    public Optional<Integer> getCurrentUserId() {
        return windowOpen && !order.isEmpty() ? Optional.of(order.peek()) : Optional.empty();
    }

    public boolean isWindowOpen() { return windowOpen; }
    public boolean isIRRound() { return currentRound.equals(RoundType.IR); }

    public List<Integer> getCurrentOrder() { return new ArrayList<>(order); }
    public List<Integer> getInitialOrder() { return new ArrayList<>(initialOrder); }

    public Map<Integer, Integer> getTurnsUsed() {
        return new HashMap<>(turnsUsed);
    }

    public Map<Integer, Integer> getUserTotalTurns() {
        return new HashMap<>(userTotalTurns);
    }
}