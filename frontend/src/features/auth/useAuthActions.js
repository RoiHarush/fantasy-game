"use client";

import { useMutation } from "@tanstack/react-query";

import {
    authenticateUser,
    requestPasswordReset,
    resendVerification,
    resetPassword,
    verifyEmail,
} from "./api";

export function useAuthenticateUser({ registering, onSuccess }) {
    return useMutation({
        mutationFn: (values) => authenticateUser(values, registering),
        onSuccess,
    });
}

export function useVerifyEmail(options = {}) {
    return useMutation({ mutationFn: verifyEmail, ...options });
}

export function useResendVerification(options = {}) {
    return useMutation({ mutationFn: resendVerification, ...options });
}

export function useRequestPasswordReset(options = {}) {
    return useMutation({ mutationFn: requestPasswordReset, ...options });
}

export function useResetPassword(options = {}) {
    return useMutation({ mutationFn: ({ token, password }) => resetPassword(token, password), ...options });
}
