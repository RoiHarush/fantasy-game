package com.fantasy.domain.game;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FixturePersistenceService {

    private final FixtureRepository fixtureRepository;

    public FixturePersistenceService(FixtureRepository fixtureRepository) {
        this.fixtureRepository = fixtureRepository;
    }

    @Transactional
    public void saveAll(List<FixtureEntity> fixtures) {
        Map<Integer, FixtureEntity> existingById = fixtureRepository
                .findAllById(fixtures.stream().map(FixtureEntity::getId).toList())
                .stream()
                .collect(Collectors.toMap(FixtureEntity::getId, Function.identity()));

        for (FixtureEntity fixture : fixtures) {
            FixtureEntity existing = existingById.get(fixture.getId());
            if (existing == null) continue;

            Integer postponedFrom = existing.getPostponedFromGameweekId();
            if (postponedFrom == null
                    && existing.getGameweekId() > 0
                    && existing.getGameweekId() != fixture.getGameweekId()) {
                postponedFrom = existing.getGameweekId();
            }
            fixture.setPostponedFromGameweekId(postponedFrom);
        }
        fixtureRepository.saveAll(fixtures);
    }
}
