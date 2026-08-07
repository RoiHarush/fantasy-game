"use client";

import { useMutation } from "@tanstack/react-query";

import { updateUserSettings } from "./api";

export function useUpdateSettings(options = {}) {
    return useMutation({
        mutationFn: updateUserSettings,
        onSuccess: options.onSuccess,
        onError: options.onError,
    });
}
