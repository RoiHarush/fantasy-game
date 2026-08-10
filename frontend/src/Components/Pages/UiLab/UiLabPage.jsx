"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ArrowRightLeft, Beaker, Crown, Play, ShieldX, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { usePlayers } from "../../../features/players/usePlayers";
import { Button } from "../../../shared/ui/Button";
import CompareModal from "../../General/CompareModal";
import HistoryModal from "../../General/HistoryModal";
import PlayerActionModal from "../../General/PlayerActionModal";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import PlayerMatchModal from "../../General/PlayerMatchModal";
import ConfirmFirstPickCaptainModal from "../PickTeamTab/FirstPickCaptain/ConfirmFirstPickCaptainModal";
import ConfirmGameweekChipModal from "../PickTeamTab/GameweekChip/ConfirmGameweekChipModal";
import ConfirmIRModal from "../PickTeamTab/IR/ConfirmIRModal";
import IRModal from "../PickTeamTab/IR/IRModal";
import IRReleaseModal from "../PickTeamTab/IR/IRReleaseModal";
import WaiverCandidateDialog from "../ScoutTab/WaiverCandidateDialog";
import DraftPickDialog from "../TransferWindowTab/DraftPickDialog";
import IRSignModal from "../TransferWindowTab/IRSignModal";
import ReplacementModal from "../TransferWindowTab/ReplacementModal";
import TurnOrderModal from "../TransferWindowTab/TurnOrderModal";

const FALLBACK_PLAYERS = [
    mockPlayer(9001, "David", "Raya", "Raya", "GK", 1, "Arsenal", 126),
    mockPlayer(9002, "William", "Saliba", "Saliba", "DEF", 1, "Arsenal", 119),
    mockPlayer(9003, "Virgil", "van Dijk", "Van Dijk", "DEF", 14, "Liverpool", 142),
    mockPlayer(9004, "Bukayo", "Saka", "Saka", "MID", 1, "Arsenal", 158),
    mockPlayer(9005, "Erling", "Haaland", "Haaland", "FWD", 15, "Man City", 181),
    mockPlayer(9006, "Ollie", "Watkins", "Watkins", "FWD", 2, "Aston Villa", 154),
];

const GROUPS = [
    {
        title: "Players & points",
        description: "Player interactions and read-only information surfaces.",
        demos: [
            ["player-actions", "Player actions", "Switch, captain, vice and information"],
            ["player-info", "Player information", "Fixtures and statistics"],
            ["match-points", "Match points", "Per-fixture points breakdown"],
            ["compare", "Compare players", "Side-by-side comparison"],
            ["history", "Points history", "Gameweek history table"],
        ],
    },
    {
        title: "Chips & IR",
        description: "Confirmation sheets and IR selection flows.",
        demos: [
            ["triple-captain", "Triple Captain", "Gameweek chip confirmation"],
            ["bench-boost", "Bench Boost", "Gameweek chip confirmation"],
            ["first-pick", "First Pick Captain", "First-pick confirmation sheet"],
            ["ir-confirm", "IR confirmation", "Move a player into IR"],
            ["ir-select", "Select IR player", "Eligible squad-player list"],
            ["ir-release", "Release IR player", "Choose the outgoing replacement"],
        ],
    },
    {
        title: "Transfers & draft",
        description: "All preview actions are isolated and never reach a mutation endpoint.",
        demos: [
            ["waiver", "Build waiver", "Incoming and outgoing player selection"],
            ["draft-pick", "Confirm draft pick", "Draft selection confirmation"],
            ["replacement", "Manual replacement", "Transfer player comparison"],
            ["ir-sign", "IR signing", "Sign an IR replacement"],
            ["turn-order", "Manage transfer order", "Two-round order editor"],
        ],
    },
    {
        title: "League confirmations",
        description: "Manager confirmation patterns used around league control.",
        demos: [
            ["open-window", "Open transfer window", "Early window confirmation"],
            ["open-draft", "Open draft now", "Supplemental draft confirmation"],
            ["remove-manager", "Remove manager", "Destructive league action"],
        ],
    },
];

export default function UiLabPage() {
    const [activeDemo, setActiveDemo] = useState(null);
    const { user } = useAuth();
    const playersQuery = usePlayers();
    const gameweek = useGameweek();
    const players = playersQuery.players.length >= 2 ? playersQuery.players : FALLBACK_PLAYERS;
    const primaryPlayer = players[0];
    const secondaryPlayer = players.find((player) => player.position === primaryPlayer.position && player.id !== primaryPlayer.id)
        ?? players[1];
    const previewPlayers = useMemo(() => {
        const uniquePlayers = [primaryPlayer, secondaryPlayer, ...players]
            .filter(Boolean)
            .filter((player, index, values) => values.findIndex((item) => String(item.id) === String(player.id)) === index);
        return uniquePlayers.slice(0, 8);
    }, [players, primaryPlayer, secondaryPlayer]);
    const previewSquad = useMemo(() => buildPreviewSquad(previewPlayers), [previewPlayers]);
    const previewUsers = [
        { id: user?.id ?? 1, name: user?.name || "Roi Harush", fantasyTeamName: user?.fantasyTeamName || "Roi FC" },
        { id: 8202, name: "Demo Manager", fantasyTeamName: "North London XI" },
        { id: 8203, name: "Test Manager", fantasyTeamName: "Electric City" },
    ];
    const close = () => setActiveDemo(null);
    const nextGameweek = gameweek.nextGameweek ?? { id: 1, name: "Gameweek 1" };

    return (
        <main className="mx-auto w-full max-w-7xl px-3 py-5 text-app-foreground sm:px-6 sm:py-9">
            <header className="overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-panel">
                <div className="bg-component-gradient px-5 py-6 text-brand-ink sm:px-8 sm:py-8">
                    <div className="flex items-start gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-brand-ink/20 bg-white/25 shadow-sm">
                            <Beaker className="size-6" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-65">Development only</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">UI interaction lab</h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold opacity-75 sm:text-base">
                                Open every modal, dialog and mobile sheet on demand. Preview actions are isolated from real league data.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-3 border-t border-app-border bg-app-accent-surface px-5 py-3 text-xs font-bold text-app-accent-foreground sm:px-8 sm:text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    This temporary route and its navigation tab are removed automatically from production builds.
                </div>
            </header>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {GROUPS.map((group) => (
                    <section key={group.title} className="rounded-3xl border border-app-border bg-app-surface p-4 shadow-panel sm:p-6">
                        <h2 className="text-lg font-black sm:text-xl">{group.title}</h2>
                        <p className="mt-1 text-xs leading-5 text-app-muted sm:text-sm">{group.description}</p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {group.demos.map(([id, label, description]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveDemo(id)}
                                    className="group flex min-h-20 items-center gap-3 rounded-2xl border border-app-border bg-app-surface-elevated p-3 text-left transition hover:-translate-y-0.5 hover:border-app-accent-border hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                >
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-app-accent-surface text-app-accent-foreground transition group-hover:bg-component-gradient group-hover:text-brand-ink">
                                        <Play className="size-4" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0">
                                        <strong className="block text-sm font-black">{label}</strong>
                                        <small className="mt-0.5 block text-[0.68rem] leading-4 text-app-muted sm:text-xs">{description}</small>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <ActivePreview
                id={activeDemo}
                close={close}
                user={user}
                players={previewPlayers}
                primaryPlayer={primaryPlayer}
                secondaryPlayer={secondaryPlayer}
                squad={previewSquad}
                nextGameweek={nextGameweek}
                users={previewUsers}
            />
        </main>
    );
}

function ActivePreview({ id, close, user, players, primaryPlayer, secondaryPlayer, squad, nextGameweek, users }) {
    if (!id) return null;
    const safeUser = user ?? { id: 1, leagueId: 1 };

    if (id === "player-actions") return <PlayerActionModal player={primaryPlayer} squad={squad} onClose={close} onSwitch={close} onSetCaptain={close} onSetVice={close} onViewInfo={close} isCaptain={false} isVice={false} canBeCaptain firstPickUsed={false} />;
    if (id === "player-info") return <PlayerInfoModal player={primaryPlayer} onClose={close} />;
    if (id === "match-points") return <PlayerMatchModal player={primaryPlayer} gameweek={nextGameweek} user={safeUser} onViewInfo={close} onClose={close} />;
    if (id === "compare") return <CompareModal players={[primaryPlayer, secondaryPlayer]} onClose={close} />;
    if (id === "history") return <HistoryModal userId={safeUser.id} onClose={close} />;
    if (id === "triple-captain") return <ConfirmGameweekChipModal title="Triple Captain" icon="/Icons/tcaptain-chip.svg" description={<>Your captain scores <strong>triple points</strong> for the next Gameweek.</>} active={false} onConfirm={close} onCancel={close} />;
    if (id === "bench-boost") return <ConfirmGameweekChipModal title="Bench Boost" icon="/Icons/bboost-chip.svg" description={<>All four bench players contribute to your Gameweek score.</>} active={false} onConfirm={close} onCancel={close} />;
    if (id === "first-pick") return <ConfirmFirstPickCaptainModal player={primaryPlayer} isActive={false} onConfirm={close} onCancel={close} />;
    if (id === "ir-confirm") return <ConfirmIRModal confirmIRPlayer={primaryPlayer} isActive={false} irPlayer={secondaryPlayer} onConfirm={close} onCancel={close} />;
    if (id === "ir-select") return <IRModal squad={squad} players={players} onSelect={close} onClose={close} />;
    if (id === "ir-release") return <IRReleaseModal squad={squad} players={players} irPlayer={primaryPlayer} onConfirm={close} onClose={close} />;
    if (id === "waiver") return <WaiverCandidateDialog candidate={primaryPlayer} eligibleOutgoing={[secondaryPlayer]} entries={[]} onChange={async () => {}} saving={false} onClose={close} />;
    if (id === "draft-pick") return <DraftPickDialog player={primaryPlayer} mutation={{ mutate: close, isPending: false, error: null }} onClose={close} />;
    if (id === "replacement") return <ReplacementModal playerIn={primaryPlayer} user={safeUser} onClose={close} players={players} fixturesByTeam={{}} nextGameweek={nextGameweek} previewMode previewSquad={squad} />;
    if (id === "ir-sign") return <IRSignModal player={primaryPlayer} user={safeUser} onClose={close} previewMode />;
    if (id === "turn-order") return <TurnOrderModal onClose={close} usersList={users} previewMode />;
    if (id === "open-window") return <ConfirmationPreview icon={ArrowRightLeft} eyebrow="Transfer window" title="Open the transfer window now?" description="Managers will immediately be able to make their scheduled picks." confirmLabel="Open now" onClose={close} />;
    if (id === "open-draft") return <ConfirmationPreview icon={Crown} eyebrow="Supplemental draft" title="Open the draft now?" description="This starts the two-round supplemental draft immediately for every league manager." confirmLabel="Open draft" onClose={close} />;
    if (id === "remove-manager") return <ConfirmationPreview icon={ShieldX} eyebrow="League member" title="Remove this manager?" description="They will lose access to this league. This action is only available before the first draft." confirmLabel="Remove manager" destructive onClose={close} />;
    return null;
}

function ConfirmationPreview({ icon: Icon, eyebrow, title, description, confirmLabel, destructive = false, onClose }) {
    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-sm" />
                <Dialog.Content className="fixed bottom-0 left-1/2 z-[5001] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-t-3xl border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl focus:outline-none sm:top-1/2 sm:bottom-auto sm:w-[min(calc(100vw-1.5rem),27rem)] sm:-translate-y-1/2 sm:rounded-3xl">
                    <div className="h-1.5 bg-component-gradient" aria-hidden="true" />
                    <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" className="absolute right-3 top-3 text-app-muted" aria-label="Close"><X aria-hidden="true" /></Button>
                        </Dialog.Close>
                        <span className="grid size-12 place-items-center rounded-2xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground"><Icon aria-hidden="true" /></span>
                        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-app-muted">{eyebrow}</p>
                        <Dialog.Title className="mt-1 text-xl font-black sm:text-2xl">{title}</Dialog.Title>
                        <Dialog.Description className="mt-3 text-sm leading-6 text-app-muted">{description}</Dialog.Description>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Dialog.Close asChild><Button variant="secondary">Back</Button></Dialog.Close>
                            <Button variant={destructive ? "danger" : "primary"} onClick={onClose}>{confirmLabel}</Button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function buildPreviewSquad(players) {
    const ids = players.map((player) => player.id);
    return {
        firstPickId: ids[0] ?? null,
        startingLineup: {
            GK: ids.slice(0, 1),
            DEF: ids.slice(1, 3),
            MID: ids.slice(3, 4),
            FWD: ids.slice(4, 5),
        },
        bench: {
            GK: ids[5] ?? ids[0] ?? null,
            S1: ids[1] ?? null,
            S2: ids[2] ?? null,
            S3: ids[3] ?? null,
        },
    };
}

function mockPlayer(id, firstName, lastName, viewName, position, teamId, teamName, points) {
    return {
        id,
        firstName,
        lastName,
        viewName,
        position,
        teamId,
        teamName,
        teamShort: teamName.slice(0, 3).toUpperCase(),
        points,
        photo: null,
        injured: false,
        chanceOfPlayingNextRound: 100,
    };
}
