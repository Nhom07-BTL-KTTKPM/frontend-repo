import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/userApi';

const extractCustomer = (res: unknown): { id?: string } => {
    if (typeof res === 'object' && res !== null) {
        if ('data' in res) {
            return (res as Record<string, unknown>).data as { id?: string };
        }
        if ('id' in res) {
            return res as { id?: string };
        }
    }
    return {};
};

/** Cooldown on any error (ms) - 30 seconds */
const ERROR_COOLDOWN_MS = 60_000;
/** Minimum gap between ANY two fetch attempts (ms) */
const MIN_RETRY_GAP_MS = 3_000;

export const useCustomerId = () => {
    const accountId = useAuthStore((state) => state.user?.accountId);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

    const consecutiveFailures = useRef(0);
    const lastFetchTimestamp = useRef<number>(0);

    const fetchCustomerId = useCallback(async (force = false) => {
        if (!accountId) {
            setCustomerId(null);
            setError(null);
            setRateLimitedUntil(null);
            consecutiveFailures.current = 0;
            return;
        }

        const now = Date.now();

        // Prevent spam
        if (now - lastFetchTimestamp.current < MIN_RETRY_GAP_MS) {
            return;
        }

        if (!force && rateLimitedUntil && now < rateLimitedUntil) {
            return;
        }

        lastFetchTimestamp.current = now;
        setLoading(true);

        try {
            const res = await userApi.getCustomerByAccountId(accountId);
            const customer = extractCustomer(res);
            setCustomerId(customer.id ?? null);
            setError(null);
            setRateLimitedUntil(null);
            consecutiveFailures.current = 0;
        } catch {
            consecutiveFailures.current += 1;

            // Exponential backoff: 30s → 60s → 120s → max 5 min
            const backoff = Math.min(
                Math.pow(2, consecutiveFailures.current - 1),
                10
            );
            const retryDelayMs = Math.min(ERROR_COOLDOWN_MS * backoff, 300_000);

            setRateLimitedUntil(Date.now() + retryDelayMs);
            setError('rate_limited');
            setCustomerId(null);
        } finally {
            setLoading(false);
        }
    }, [accountId, rateLimitedUntil]);

    useEffect(() => {
        fetchCustomerId();
    }, [fetchCustomerId]);

    const now = Date.now();
    const retryInMs = rateLimitedUntil ? Math.max(0, rateLimitedUntil - now) : 0;
    const isRateLimited = !!rateLimitedUntil && retryInMs > 0;

    return {
        customerId,
        loading,
        error,
        isRateLimited,
        retryInMs,
        retry: () => fetchCustomerId(true),
    };
};
