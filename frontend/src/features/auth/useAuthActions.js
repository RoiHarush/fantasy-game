"use client";

import { useMutation } from "@tanstack/react-query";

import { authenticateUser } from "./api";

export function useAuthenticateUser({ registering, onSuccess }) {
    return useMutation({
        mutationFn: (values) => authenticateUser(values, registering),
        onSuccess,
    });
}
