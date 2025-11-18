package com.fantasy.application;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.transfer.TransferPickEntity;

import com.fantasy.dto.TurnOrderDto;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TurnService {

    private final GameWeekRepository gameWeekRepo;

    public TurnService(GameWeekRepository gameWeekRepo) {
        this.gameWeekRepo = gameWeekRepo;
    }

    @Transactional
    public void setTurns(int gwId, TurnOrderDto dto) {
        var gameWeek = gameWeekRepo.findById(gwId)
                .orElseThrow(() -> new RuntimeException("GameWeek not found: " + gwId));

        List<TransferPickEntity> newList = makeTransferPickList(dto, gameWeek);

        if (gameWeek.getTransferOrder() == null) {
            gameWeek.setTransferOrder(new ArrayList<>());
        }

        gameWeek.getTransferOrder().clear();
        gameWeek.getTransferOrder().addAll(newList);

        gameWeekRepo.save(gameWeek);
    }

    public List<Integer> getCurrentTurnOrder(int gwId) {
        var gameWeek = gameWeekRepo.findById(gwId)
                .orElseThrow(() -> new RuntimeException("GameWeek not found: " + gwId));

        if (gameWeek.getTransferOrder() == null) {
            return new ArrayList<>();
        }

        return gameWeek.getTransferOrder().stream()
                .sorted(Comparator.comparingInt(TransferPickEntity::getPosition))
                .map(TransferPickEntity::getUserId)
                .collect(Collectors.toList());
    }

    private List<TransferPickEntity> makeTransferPickList(TurnOrderDto order, GameWeekEntity gameWeekEntity){
        List<TransferPickEntity> result = new ArrayList<>();

        if (order.getOrder() != null) {
            for (int i = 0; i < order.getOrder().size(); i++){
                TransferPickEntity pick = new TransferPickEntity();
                pick.setUserId(order.getOrder().get(i));
                pick.setPosition(i);
                pick.setGameWeek(gameWeekEntity);
                result.add(pick);
            }
        }
        return result;
    }
}