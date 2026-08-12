package com.fantasy.domain.team;

/**
 * Immutable result of one automatic lineup substitution.
 */
public record AutoSubstitution(int playerInId, int playerOutId, int sequence) {
}
