const positions = {
    GK: "goalkeeper",
    DEF: "defender",
    MID: "midfielder",
    FWD: "forward"
};

export const mockSquadRules = {
    minPlayersInPosition: {
        GK: 1,
        DEF: 3,
        MID: 2,
        FWD: 1
    },
    maxPlayersInPosition: {
        GK: 2,
        DEF: 5,
        MID: 5,
        FWD: 3
    }
};

export const mockUser1 = {
    id: 1,
    name: "Omri Zidon",
    fantasyTeam: "Omri United",
    points: 32,
    rank: 3,
    squad: {
        startingLineup: {
            GK: [366],
            DEF: [7, 569, 374],
            MID: [381, 450, 489, 18],
            FWD: [624, 654, 136]
        },
        bench: [733, 453, 372, 403],
        formation: {
            GK: 1,
            DEF: 3,
            MID: 4,
            FWD: 3
        }
    },
    watchedPlayers: [83, 402, 575, 249]
};
const mockUser2 = {
    id: 2,
    name: "Roi Haursh",
    fantasyTeam: "Safra Boys",
    points: 43,
    rank: 2,
    squad: {
        startingLineup: {
            GK: [565],
            DEF: [36, 8, 261],
            MID: [235, 84, 418, 387],
            FWD: [661, 525, 597]
        },
        bench: [139, 370, 74, 413],
        formation: {
            GK: 1,
            DEF: 3,
            MID: 4,
            FWD: 3
        }
    },
    watchedPlayers: []
};
const mockUser3 = {
    id: 3,
    name: "Yoav Zidon",
    fantasyTeam: "Rudispor",
    points: 27,
    rank: 1,
    squad: {
        startingLineup: {
            GK: [220],
            DEF: [38, 6, 573],
            MID: [119, 384, 515, 580, 414],
            FWD: [430, 338]
        },
        bench: [101, 408, 135, 474],
        formation: {
            GK: 1,
            DEF: 3,
            MID: 5,
            FWD: 2
        }
    },
    watchedPlayers: []
};

export const users = [mockUser1, mockUser2, mockUser3];