const fixtures = [
    {
        "id": 1,
        "event": 1,
        "kickoff_time": "2025-08-15T19:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 4,
        "homeScore": 4,
        "awayScore": 2,
        "finished": true
    },
    {
        "id": 2,
        "event": 1,
        "kickoff_time": "2025-08-16T11:30:00Z",
        "homeTeamId": 2,
        "awayTeamId": 15,
        "homeScore": 0,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 3,
        "event": 1,
        "kickoff_time": "2025-08-16T14:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 10,
        "homeScore": 1,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 6,
        "event": 1,
        "kickoff_time": "2025-08-16T14:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 3,
        "homeScore": 3,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 5,
        "event": 1,
        "kickoff_time": "2025-08-16T14:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 19,
        "homeScore": 3,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 7,
        "event": 1,
        "kickoff_time": "2025-08-16T16:30:00Z",
        "homeTeamId": 20,
        "awayTeamId": 13,
        "homeScore": 0,
        "awayScore": 4,
        "finished": true
    },
    {
        "id": 8,
        "event": 1,
        "kickoff_time": "2025-08-17T13:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 8,
        "homeScore": 0,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 4,
        "event": 1,
        "kickoff_time": "2025-08-17T13:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 5,
        "homeScore": 3,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 9,
        "event": 1,
        "kickoff_time": "2025-08-17T15:30:00Z",
        "homeTeamId": 14,
        "awayTeamId": 1,
        "homeScore": 0,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 10,
        "event": 1,
        "kickoff_time": "2025-08-18T19:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 9,
        "homeScore": 1,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 20,
        "event": 2,
        "kickoff_time": "2025-08-22T19:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 7,
        "homeScore": 1,
        "awayScore": 5,
        "finished": true
    },
    {
        "id": 18,
        "event": 2,
        "kickoff_time": "2025-08-23T11:30:00Z",
        "homeTeamId": 13,
        "awayTeamId": 18,
        "homeScore": 0,
        "awayScore": 2,
        "finished": true
    },
    {
        "id": 12,
        "event": 2,
        "kickoff_time": "2025-08-23T14:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 20,
        "homeScore": 1,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 13,
        "event": 2,
        "kickoff_time": "2025-08-23T14:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 2,
        "homeScore": 1,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 14,
        "event": 2,
        "kickoff_time": "2025-08-23T14:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 17,
        "homeScore": 2,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 11,
        "event": 2,
        "kickoff_time": "2025-08-23T16:30:00Z",
        "homeTeamId": 1,
        "awayTeamId": 11,
        "homeScore": 5,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 15,
        "event": 2,
        "kickoff_time": "2025-08-24T13:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 16,
        "homeScore": 1,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 16,
        "event": 2,
        "kickoff_time": "2025-08-24T13:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 6,
        "homeScore": 2,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 17,
        "event": 2,
        "kickoff_time": "2025-08-24T15:30:00Z",
        "homeTeamId": 10,
        "awayTeamId": 14,
        "homeScore": 1,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 19,
        "event": 2,
        "kickoff_time": "2025-08-25T19:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 12,
        "homeScore": 2,
        "awayScore": 3,
        "finished": true
    },
    {
        "id": 23,
        "event": 3,
        "kickoff_time": "2025-08-30T11:30:00Z",
        "homeTeamId": 7,
        "awayTeamId": 10,
        "homeScore": 2,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 26,
        "event": 3,
        "kickoff_time": "2025-08-30T14:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 3,
        "homeScore": 3,
        "awayScore": 2,
        "finished": true
    },
    {
        "id": 29,
        "event": 3,
        "kickoff_time": "2025-08-30T14:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 4,
        "homeScore": 0,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 28,
        "event": 3,
        "kickoff_time": "2025-08-30T14:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 5,
        "homeScore": 2,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 30,
        "event": 3,
        "kickoff_time": "2025-08-30T14:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 9,
        "homeScore": 2,
        "awayScore": 3,
        "finished": true
    },
    {
        "id": 24,
        "event": 3,
        "kickoff_time": "2025-08-30T16:30:00Z",
        "homeTeamId": 11,
        "awayTeamId": 15,
        "homeScore": 0,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 22,
        "event": 3,
        "kickoff_time": "2025-08-31T13:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 13,
        "homeScore": 2,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 27,
        "event": 3,
        "kickoff_time": "2025-08-31T13:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 19,
        "homeScore": 0,
        "awayScore": 3,
        "finished": true
    },
    {
        "id": 25,
        "event": 3,
        "kickoff_time": "2025-08-31T15:30:00Z",
        "homeTeamId": 12,
        "awayTeamId": 1,
        "homeScore": 1,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 21,
        "event": 3,
        "kickoff_time": "2025-08-31T18:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 8,
        "homeScore": 0,
        "awayScore": 3,
        "finished": true
    },
    {
        "id": 31,
        "event": 4,
        "kickoff_time": "2025-09-13T11:30:00Z",
        "homeTeamId": 1,
        "awayTeamId": 16,
        "homeScore": 3,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 32,
        "event": 4,
        "kickoff_time": "2025-09-13T14:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 6,
        "homeScore": 2,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 35,
        "event": 4,
        "kickoff_time": "2025-09-13T14:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 17,
        "homeScore": 0,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 36,
        "event": 4,
        "kickoff_time": "2025-09-13T14:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 2,
        "homeScore": 0,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 37,
        "event": 4,
        "kickoff_time": "2025-09-13T14:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 11,
        "homeScore": 1,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 39,
        "event": 4,
        "kickoff_time": "2025-09-13T14:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 20,
        "homeScore": 1,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 40,
        "event": 4,
        "kickoff_time": "2025-09-13T16:30:00Z",
        "homeTeamId": 19,
        "awayTeamId": 18,
        "homeScore": 0,
        "awayScore": 3,
        "finished": true
    },
    {
        "id": 33,
        "event": 4,
        "kickoff_time": "2025-09-13T19:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 7,
        "homeScore": 2,
        "awayScore": 2,
        "finished": true
    },
    {
        "id": 34,
        "event": 4,
        "kickoff_time": "2025-09-14T13:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 12,
        "homeScore": 0,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 38,
        "event": 4,
        "kickoff_time": "2025-09-14T15:30:00Z",
        "homeTeamId": 13,
        "awayTeamId": 14,
        "homeScore": 3,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 46,
        "event": 5,
        "kickoff_time": "2025-09-20T11:30:00Z",
        "homeTeamId": 12,
        "awayTeamId": 9,
        "homeScore": 2,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 43,
        "event": 5,
        "kickoff_time": "2025-09-20T14:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 18,
        "homeScore": 2,
        "awayScore": 2,
        "finished": true
    },
    {
        "id": 44,
        "event": 5,
        "kickoff_time": "2025-09-20T14:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 16,
        "homeScore": 1,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 49,
        "event": 5,
        "kickoff_time": "2025-09-20T14:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 8,
        "homeScore": 1,
        "awayScore": 2,
        "finished": true
    },
    {
        "id": 50,
        "event": 5,
        "kickoff_time": "2025-09-20T14:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 11,
        "homeScore": 1,
        "awayScore": 3,
        "finished": true
    },
    {
        "id": 47,
        "event": 5,
        "kickoff_time": "2025-09-20T16:30:00Z",
        "homeTeamId": 14,
        "awayTeamId": 7,
        "homeScore": 2,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 45,
        "event": 5,
        "kickoff_time": "2025-09-20T19:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 5,
        "homeScore": 3,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 42,
        "event": 5,
        "kickoff_time": "2025-09-21T13:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 15,
        "homeScore": 0,
        "awayScore": 0,
        "finished": true
    },
    {
        "id": 48,
        "event": 5,
        "kickoff_time": "2025-09-21T13:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 2,
        "homeScore": 1,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 41,
        "event": 5,
        "kickoff_time": "2025-09-21T15:30:00Z",
        "homeTeamId": 1,
        "awayTeamId": 13,
        "homeScore": 1,
        "awayScore": 1,
        "finished": true
    },
    {
        "id": 52,
        "event": 6,
        "kickoff_time": "2025-09-27T11:30:00Z",
        "homeTeamId": 5,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 53,
        "event": 6,
        "kickoff_time": "2025-09-27T14:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 54,
        "event": 6,
        "kickoff_time": "2025-09-27T14:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 56,
        "event": 6,
        "kickoff_time": "2025-09-27T14:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 57,
        "event": 6,
        "kickoff_time": "2025-09-27T14:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 59,
        "event": 6,
        "kickoff_time": "2025-09-27T16:30:00Z",
        "homeTeamId": 16,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 60,
        "event": 6,
        "kickoff_time": "2025-09-27T19:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 51,
        "event": 6,
        "kickoff_time": "2025-09-28T13:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 58,
        "event": 6,
        "kickoff_time": "2025-09-28T15:30:00Z",
        "homeTeamId": 15,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 55,
        "event": 6,
        "kickoff_time": "2025-09-29T19:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 63,
        "event": 7,
        "kickoff_time": "2025-10-03T19:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 67,
        "event": 7,
        "kickoff_time": "2025-10-04T11:30:00Z",
        "homeTeamId": 11,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 61,
        "event": 7,
        "kickoff_time": "2025-10-04T14:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 68,
        "event": 7,
        "kickoff_time": "2025-10-04T14:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 65,
        "event": 7,
        "kickoff_time": "2025-10-04T16:30:00Z",
        "homeTeamId": 7,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 62,
        "event": 7,
        "kickoff_time": "2025-10-05T13:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 66,
        "event": 7,
        "kickoff_time": "2025-10-05T13:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 69,
        "event": 7,
        "kickoff_time": "2025-10-05T13:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 70,
        "event": 7,
        "kickoff_time": "2025-10-05T13:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 64,
        "event": 7,
        "kickoff_time": "2025-10-05T15:30:00Z",
        "homeTeamId": 5,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 77,
        "event": 8,
        "kickoff_time": "2025-10-18T11:30:00Z",
        "homeTeamId": 16,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 71,
        "event": 8,
        "kickoff_time": "2025-10-18T14:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 72,
        "event": 8,
        "kickoff_time": "2025-10-18T14:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 73,
        "event": 8,
        "kickoff_time": "2025-10-18T14:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 76,
        "event": 8,
        "kickoff_time": "2025-10-18T14:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 78,
        "event": 8,
        "kickoff_time": "2025-10-18T14:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 74,
        "event": 8,
        "kickoff_time": "2025-10-18T16:30:00Z",
        "homeTeamId": 10,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 79,
        "event": 8,
        "kickoff_time": "2025-10-19T13:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 75,
        "event": 8,
        "kickoff_time": "2025-10-19T15:30:00Z",
        "homeTeamId": 12,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 80,
        "event": 8,
        "kickoff_time": "2025-10-20T19:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 87,
        "event": 9,
        "kickoff_time": "2025-10-24T19:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 85,
        "event": 9,
        "kickoff_time": "2025-10-25T14:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 89,
        "event": 9,
        "kickoff_time": "2025-10-25T14:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 88,
        "event": 9,
        "kickoff_time": "2025-10-25T16:30:00Z",
        "homeTeamId": 14,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 84,
        "event": 9,
        "kickoff_time": "2025-10-25T19:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 81,
        "event": 9,
        "kickoff_time": "2025-10-26T14:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 82,
        "event": 9,
        "kickoff_time": "2025-10-26T14:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 83,
        "event": 9,
        "kickoff_time": "2025-10-26T14:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 90,
        "event": 9,
        "kickoff_time": "2025-10-26T14:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 86,
        "event": 9,
        "kickoff_time": "2025-10-26T16:30:00Z",
        "homeTeamId": 9,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 91,
        "event": 10,
        "kickoff_time": "2025-11-01T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 92,
        "event": 10,
        "kickoff_time": "2025-11-01T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 93,
        "event": 10,
        "kickoff_time": "2025-11-01T15:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 94,
        "event": 10,
        "kickoff_time": "2025-11-01T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 97,
        "event": 10,
        "kickoff_time": "2025-11-01T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 99,
        "event": 10,
        "kickoff_time": "2025-11-01T17:30:00Z",
        "homeTeamId": 18,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 95,
        "event": 10,
        "kickoff_time": "2025-11-01T20:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 100,
        "event": 10,
        "kickoff_time": "2025-11-02T14:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 96,
        "event": 10,
        "kickoff_time": "2025-11-02T16:30:00Z",
        "homeTeamId": 13,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 98,
        "event": 10,
        "kickoff_time": "2025-11-03T20:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 109,
        "event": 11,
        "kickoff_time": "2025-11-08T12:30:00Z",
        "homeTeamId": 18,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 105,
        "event": 11,
        "kickoff_time": "2025-11-08T15:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 110,
        "event": 11,
        "kickoff_time": "2025-11-08T15:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 108,
        "event": 11,
        "kickoff_time": "2025-11-08T17:30:00Z",
        "homeTeamId": 17,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 103,
        "event": 11,
        "kickoff_time": "2025-11-08T20:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 101,
        "event": 11,
        "kickoff_time": "2025-11-09T14:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 102,
        "event": 11,
        "kickoff_time": "2025-11-09T14:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 104,
        "event": 11,
        "kickoff_time": "2025-11-09T14:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 107,
        "event": 11,
        "kickoff_time": "2025-11-09T14:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 106,
        "event": 11,
        "kickoff_time": "2025-11-09T16:30:00Z",
        "homeTeamId": 13,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 114,
        "event": 12,
        "kickoff_time": "2025-11-22T12:30:00Z",
        "homeTeamId": 3,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 112,
        "event": 12,
        "kickoff_time": "2025-11-22T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 113,
        "event": 12,
        "kickoff_time": "2025-11-22T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 115,
        "event": 12,
        "kickoff_time": "2025-11-22T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 117,
        "event": 12,
        "kickoff_time": "2025-11-22T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 120,
        "event": 12,
        "kickoff_time": "2025-11-22T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 119,
        "event": 12,
        "kickoff_time": "2025-11-22T17:30:00Z",
        "homeTeamId": 15,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 116,
        "event": 12,
        "kickoff_time": "2025-11-23T14:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 111,
        "event": 12,
        "kickoff_time": "2025-11-23T16:30:00Z",
        "homeTeamId": 1,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 118,
        "event": 12,
        "kickoff_time": "2025-11-24T20:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 122,
        "event": 13,
        "kickoff_time": "2025-11-29T15:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 126,
        "event": 13,
        "kickoff_time": "2025-11-29T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 128,
        "event": 13,
        "kickoff_time": "2025-11-29T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 125,
        "event": 13,
        "kickoff_time": "2025-11-29T17:30:00Z",
        "homeTeamId": 9,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 129,
        "event": 13,
        "kickoff_time": "2025-11-29T20:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 124,
        "event": 13,
        "kickoff_time": "2025-11-30T12:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 121,
        "event": 13,
        "kickoff_time": "2025-11-30T14:05:00Z",
        "homeTeamId": 2,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 127,
        "event": 13,
        "kickoff_time": "2025-11-30T14:05:00Z",
        "homeTeamId": 16,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 130,
        "event": 13,
        "kickoff_time": "2025-11-30T14:05:00Z",
        "homeTeamId": 19,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 123,
        "event": 13,
        "kickoff_time": "2025-11-30T16:30:00Z",
        "homeTeamId": 7,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 131,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 132,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 133,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 134,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 135,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 136,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 137,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 138,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 139,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 140,
        "event": 14,
        "kickoff_time": "2025-12-03T20:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 141,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 142,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 143,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 144,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 145,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 146,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 147,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 148,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 149,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 150,
        "event": 15,
        "kickoff_time": "2025-12-06T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 151,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 152,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 153,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 154,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 155,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 156,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 157,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 158,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 159,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 160,
        "event": 16,
        "kickoff_time": "2025-12-13T15:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 161,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 162,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 163,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 164,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 165,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 166,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 167,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 168,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 169,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 170,
        "event": 17,
        "kickoff_time": "2025-12-20T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 171,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 172,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 173,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 174,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 175,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 176,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 177,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 178,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 179,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 180,
        "event": 18,
        "kickoff_time": "2025-12-27T15:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 181,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 182,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 183,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 184,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 185,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 186,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 187,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 188,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 189,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 190,
        "event": 19,
        "kickoff_time": "2025-12-30T20:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 191,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 192,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 193,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 194,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 195,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 196,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 197,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 198,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 199,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 200,
        "event": 20,
        "kickoff_time": "2026-01-03T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 201,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 202,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 203,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 204,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 205,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 206,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 207,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 208,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 209,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 210,
        "event": 21,
        "kickoff_time": "2026-01-07T20:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 211,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 212,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 213,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 214,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 215,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 216,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 217,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 219,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 218,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 220,
        "event": 22,
        "kickoff_time": "2026-01-17T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 221,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 222,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 223,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 224,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 225,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 226,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 227,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 228,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 229,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 230,
        "event": 23,
        "kickoff_time": "2026-01-24T15:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 231,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 232,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 233,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 234,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 235,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 236,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 237,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 239,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 238,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 240,
        "event": 24,
        "kickoff_time": "2026-01-31T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 241,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 242,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 243,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 244,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 245,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 246,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 247,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 248,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 249,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 250,
        "event": 25,
        "kickoff_time": "2026-02-07T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 251,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 252,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 253,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 254,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 255,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 256,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 257,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 259,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 258,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 260,
        "event": 26,
        "kickoff_time": "2026-02-11T20:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 261,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 262,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 263,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 264,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 265,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 266,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 267,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 269,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 268,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 270,
        "event": 27,
        "kickoff_time": "2026-02-21T15:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 271,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 272,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 273,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 274,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 275,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 276,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 277,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 278,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 279,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 280,
        "event": 28,
        "kickoff_time": "2026-02-28T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 281,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 282,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 283,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 284,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 285,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 286,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 287,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 288,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 289,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 290,
        "event": 29,
        "kickoff_time": "2026-03-04T20:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 291,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 292,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 293,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 294,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 295,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 296,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 297,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 298,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 299,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 300,
        "event": 30,
        "kickoff_time": "2026-03-14T15:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 301,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 302,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 303,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 304,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 305,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 306,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 307,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 308,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 309,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 310,
        "event": 31,
        "kickoff_time": "2026-03-21T15:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 311,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 312,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 313,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 314,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 315,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 316,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 317,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 318,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 319,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 320,
        "event": 32,
        "kickoff_time": "2026-04-11T14:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 321,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 322,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 323,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 324,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 325,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 326,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 327,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 328,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 329,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 330,
        "event": 33,
        "kickoff_time": "2026-04-18T14:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 331,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 332,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 333,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 334,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 335,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 336,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 337,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 338,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 339,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 340,
        "event": 34,
        "kickoff_time": "2026-04-25T14:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 341,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 342,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 343,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 344,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 345,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 346,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 347,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 348,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 349,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 350,
        "event": 35,
        "kickoff_time": "2026-05-02T14:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 351,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 352,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 353,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 354,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 355,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 356,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 357,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 359,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 358,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 360,
        "event": 36,
        "kickoff_time": "2026-05-09T14:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 361,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 1,
        "awayTeamId": 3,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 362,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 2,
        "awayTeamId": 12,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 363,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 4,
        "awayTeamId": 13,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 364,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 5,
        "awayTeamId": 8,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 365,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 7,
        "awayTeamId": 18,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 366,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 9,
        "awayTeamId": 17,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 367,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 11,
        "awayTeamId": 6,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 368,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 14,
        "awayTeamId": 16,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 369,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 15,
        "awayTeamId": 19,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 370,
        "event": 37,
        "kickoff_time": "2026-05-17T14:00:00Z",
        "homeTeamId": 20,
        "awayTeamId": 10,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 371,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 6,
        "awayTeamId": 14,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 372,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 3,
        "awayTeamId": 20,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 373,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 8,
        "awayTeamId": 1,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 374,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 10,
        "awayTeamId": 15,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 375,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 12,
        "awayTeamId": 5,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 376,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 13,
        "awayTeamId": 2,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 377,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 16,
        "awayTeamId": 4,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 379,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 18,
        "awayTeamId": 9,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 378,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 17,
        "awayTeamId": 7,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    },
    {
        "id": 380,
        "event": 38,
        "kickoff_time": "2026-05-24T15:00:00Z",
        "homeTeamId": 19,
        "awayTeamId": 11,
        "homeScore": null,
        "awayScore": null,
        "finished": false
    }
];

export default fixtures;