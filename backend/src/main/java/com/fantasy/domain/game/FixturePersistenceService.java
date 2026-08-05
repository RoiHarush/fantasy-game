package com.fantasy.domain.game;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FixturePersistenceService {

    private final FixtureRepository fixtureRepository;

    public FixturePersistenceService(FixtureRepository fixtureRepository) {
        this.fixtureRepository = fixtureRepository;
    }

    @Transactional
    public void saveAll(List<FixtureEntity> fixtures) {
        fixtureRepository.saveAll(fixtures);
    }
}
