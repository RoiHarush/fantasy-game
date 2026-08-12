package com.fantasy.domain.team;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "auto_substitutions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"squad_id", "sequence_number"})
)
public class AutoSubstitutionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "squad_id", nullable = false)
    private UserSquadEntity squad;

    @Column(name = "sequence_number", nullable = false)
    private int sequence;

    @Column(name = "player_in_id", nullable = false)
    private int playerInId;

    @Column(name = "player_out_id", nullable = false)
    private int playerOutId;

    public Long getId() { return id; }

    public UserSquadEntity getSquad() { return squad; }
    public void setSquad(UserSquadEntity squad) { this.squad = squad; }

    public int getSequence() { return sequence; }
    public void setSequence(int sequence) { this.sequence = sequence; }

    public int getPlayerInId() { return playerInId; }
    public void setPlayerInId(int playerInId) { this.playerInId = playerInId; }

    public int getPlayerOutId() { return playerOutId; }
    public void setPlayerOutId(int playerOutId) { this.playerOutId = playerOutId; }
}
