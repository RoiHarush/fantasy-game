"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ArrowRightLeft, Beaker, Crown, Play, ShieldX } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { usePlayers } from "../../../features/players/usePlayers";
import { CookieConsentContent } from "../../../features/privacy/CookieConsentToast";
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";
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
import UiLabScreenPreview from "./UiLabScreenPreview";

const FALLBACK_PLAYERS = [
    mockPlayer(9001, "David", "Raya", "Raya", "GK", 1, "Arsenal", 126),
    mockPlayer(9002, "William", "Saliba", "Saliba", "DEF", 1, "Arsenal", 119),
    mockPlayer(9003, "Virgil", "van Dijk", "Van Dijk", "DEF", 14, "Liverpool", 142),
    mockPlayer(9004, "Bukayo", "Saka", "Saka", "MID", 1, "Arsenal", 158),
    mockPlayer(9005, "Erling", "Haaland", "Haaland", "FWD", 15, "Man City", 181),
    mockPlayer(9006, "Ollie", "Watkins", "Watkins", "FWD", 2, "Aston Villa", 154),
    mockPlayer(9007, "Cole", "Palmer", "Palmer", "MID", 6, "Chelsea", 176),
    mockPlayer(9008, "Bruno", "Guimaraes", "Guimaraes", "MID", 17, "Newcastle", 121),
    mockPlayer(9009, "Micky", "van de Ven", "Van de Ven", "DEF", 19, "Spurs", 98),
    mockPlayer(9010, "Emiliano", "Martinez", "Martinez", "GK", 2, "Aston Villa", 110),
    mockPlayer(9011, "Gabriel", "Magalhaes", "Gabriel", "DEF", 1, "Arsenal", 132),
    mockPlayer(9012, "Josko", "Gvardiol", "Gvardiol", "DEF", 15, "Man City", 126),
    mockPlayer(9013, "Mohamed", "Salah", "Salah", "MID", 14, "Liverpool", 190),
    mockPlayer(9014, "Anthony", "Gordon", "Gordon", "MID", 17, "Newcastle", 118),
    mockPlayer(9015, "Alexander", "Isak", "Isak", "FWD", 17, "Newcastle", 149),
];

const COOKIE_PREVIEW_TOAST_ID = "ui-lab-cookie-preview";
const SCREEN_DEMO_IDS = new Set(["screen-draft", "screen-transfer", "screen-points", "screen-status"]);

const GROUPS = [
    {
        title: "Full screen states",
        description: "Open isolated page states that are not currently reachable in the live season timeline.",
        demos: [
            ["screen-draft", "Active draft room", "Live supplemental draft with managers and squad"],
            ["screen-transfer", "Open transfer window", "A manager's active transfer turn"],
            ["screen-points", "Regular-season points", "Gameweek points, pitch and fixtures"],
            ["screen-status", "Regular-season status", "Live round summary, deadlines and activity"],
        ],
    },
    {
        title: "Players & points",
        description: "Player interactions and read-only information surfaces.",
        demos: [
            ["player-actions", "Player actions", "Switch, captain, vice and information"],
            ["player-info", "Player information", "Fixtures and statistics"],
            ["match-points-single", "Single-fixture points", "One match in a Gameweek"],
            ["match-points-double", "Double Gameweek points", "Two matches and their combined score"],
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
    {
        title: "Toasts & notifications",
        description: "Every notification style currently used by the application.",
        demos: [
            ["toast-success", "Success toast", "Successful profile update"],
            ["toast-error", "Error toast", "Failed profile update"],
            ["toast-cookie", "Cookie preferences", "Cookie-consent notification"],
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
        return uniquePlayers.slice(0, 15);
    }, [players, primaryPlayer, secondaryPlayer]);
    const previewSquad = useMemo(() => buildPreviewSquad(previewPlayers), [previewPlayers]);
    const previewUsers = [
        { id: user?.id ?? 1, name: user?.name || "Roi Harush", fantasyTeamName: user?.fantasyTeamName || "Roi FC" },
        { id: 8202, name: "Demo Manager", fantasyTeamName: "North London XI" },
        { id: 8203, name: "Test Manager", fantasyTeamName: "Electric City" },
    ];
    const close = () => setActiveDemo(null);
    const nextGameweek = gameweek.nextGameweek ?? { id: 1, name: "Gameweek 1" };
    const launchDemo = (id) => {
        if (id === "toast-success") {
            toast.success("Team identity updated");
            return;
        }
        if (id === "toast-error") {
            toast.error("Unable to update your team");
            return;
        }
        if (id === "toast-cookie") {
            toast.dismiss();
            toast.custom(
                () => (
                    <CookieConsentContent
                        onPreference={() => toast.dismiss(COOKIE_PREVIEW_TOAST_ID)}
                    />
                ),
                {
                    id: COOKIE_PREVIEW_TOAST_ID,
                    duration: Infinity,
                    dismissible: true,
                },
            );
            return;
        }
        setActiveDemo(id);
    };

    if (SCREEN_DEMO_IDS.has(activeDemo)) {
        return (
            <UiLabScreenPreview
                id={activeDemo}
                user={user}
                users={previewUsers}
                players={previewPlayers}
                squad={previewSquad}
                onClose={close}
            />
        );
    }

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
                                    onClick={() => launchDemo(id)}
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
    if (id === "match-points-single") return <PlayerMatchModal player={primaryPlayer} gameweek={nextGameweek} user={safeUser} previewData={buildMatchPointsPreview(primaryPlayer, false)} onViewInfo={close} onClose={close} />;
    if (id === "match-points-double") return <PlayerMatchModal player={primaryPlayer} gameweek={nextGameweek} user={safeUser} previewData={buildMatchPointsPreview(primaryPlayer, true)} onViewInfo={close} onClose={close} />;
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
    if (id === "replacement") return <ReplacementModal playerIn={secondaryPlayer} user={safeUser} onClose={close} players={players} fixturesByTeam={{}} nextGameweek={nextGameweek} previewMode previewSquad={squad} />;
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
            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-1.5rem),27rem)]">
                    <div className="relative p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                        <Dialog.Close asChild>
                            <CloseButton className="absolute right-3 top-3" aria-label="Close" />
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
            </ResponsiveDialogSurface>
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
            MID: ids.slice(3, 5),
            FWD: ids.slice(5, 6),
        },
        bench: {
            GK: ids[6] ?? null,
            S1: ids[7] ?? null,
            S2: ids[8] ?? null,
            S3: null,
        },
    };
}

function buildMatchPointsPreview(player, doubleGameweek) {
    const firstFixture = {
        fixtureId: 9101,
        gameweekId: 1,
        playerName: player?.viewName || "David Raya",
        homeTeamId: 1,
        awayTeamId: 15,
        homeTeamName: "Arsenal",
        awayTeamName: "Man City",
        homeScore: 1,
        awayScore: 1,
        stats: doubleGameweek
            ? [matchStat("Minutes played", "90", 2, "/Icons/stopwatch.svg"), matchStat("Total", "", 2, "/Icons/total.svg")]
            : [
                matchStat("Minutes played", "90", 2, "/Icons/stopwatch.svg"),
                matchStat("Clean sheets", "1", 4, "/Icons/gk-clean-sheets.svg"),
                matchStat("Forward bonus", "2", 2, "/Icons/forward-bonus.svg"),
                matchStat("Total", "", 8, "/Icons/total.svg"),
            ],
    };
    const secondFixture = {
        fixtureId: 9102,
        gameweekId: 1,
        playerName: player?.viewName || "David Raya",
        homeTeamId: 14,
        awayTeamId: 1,
        homeTeamName: "Liverpool",
        awayTeamName: "Arsenal",
        homeScore: 0,
        awayScore: 1,
        stats: [
            matchStat("Minutes played", "90", 2, "/Icons/stopwatch.svg"),
            matchStat("Clean sheets", "1", 4, "/Icons/gk-clean-sheets.svg"),
            matchStat("Forward bonus", "1", 1, "/Icons/forward-bonus.svg"),
            matchStat("Total", "", 7, "/Icons/total.svg"),
        ],
    };

    return {
        playerId: player?.id ?? 9001,
        playerName: player?.viewName || "David Raya",
        gameweekId: 1,
        captainMultiplier: 1,
        stats: [matchStat("Total", "", doubleGameweek ? 9 : 8, "/Icons/total.svg")],
        fixtures: doubleGameweek ? [firstFixture, secondFixture] : [firstFixture],
    };
}

function matchStat(name, value, points, iconPath) {
    return { name, value, points, iconPath };
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
