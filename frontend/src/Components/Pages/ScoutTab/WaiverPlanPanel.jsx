import styles from "../../../Styles/WaiverScout.module.css";

function WaiverPlanPanel({ entries, playersById, onChange, saving, message, gameWeekId }) {
    const move = (from, to) => {
        if (to < 0 || to >= entries.length || from === to) return;
        const reordered = [...entries];
        const [entry] = reordered.splice(from, 1);
        reordered.splice(to, 0, entry);
        void onChange(reordered);
    };

    const playerName = id => playersById.get(id)?.viewName || `Player #${id}`;

    return (
        <section className={styles.panel}>
            <header>
                <div>
                    <p>Gameweek {gameWeekId}</p>
                    <h3>Waiver priorities</h3>
                </div>
                <span>{saving ? "Saving…" : "Saved automatically"}</span>
            </header>
            <p className={styles.help}>
                These choices are attempted only if you are offline when your transfer turn begins.
                Drag rows or change their priority number to reorder them.
            </p>
            {message && <p className={styles.message}>{message}</p>}
            <ol className={styles.list}>
                {entries.map((entry, index) => (
                    <li
                        key={`${entry.playerInId}-${entry.playerOutId}`}
                        draggable
                        onDragStart={event => event.dataTransfer.setData("text/plain", String(index))}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => {
                            event.preventDefault();
                            move(Number(event.dataTransfer.getData("text/plain")), index);
                        }}
                    >
                        <input
                            aria-label={`Priority for ${playerName(entry.playerInId)}`}
                            type="number"
                            min="1"
                            max={entries.length}
                            value={index + 1}
                            onChange={event => move(index, Number(event.target.value) - 1)}
                        />
                        <div>
                            <strong>IN {playerName(entry.playerInId)}</strong>
                            <span>OUT {playerName(entry.playerOutId)}</span>
                        </div>
                        <button type="button" onClick={() => void onChange(entries.filter((_, itemIndex) => itemIndex !== index))}>
                            Remove
                        </button>
                    </li>
                ))}
            </ol>
            {entries.length === 0 && <p className={styles.empty}>No waiver priorities prepared for this gameweek.</p>}
        </section>
    );
}

export default WaiverPlanPanel;
