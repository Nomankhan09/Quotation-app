// app/ErrorReporter.ts
import { Platform } from "react-native";
import { API_URL } from "../services/api";

export const sendErrorToServer = async (payload: any) => {
    try {
        const res = await fetch(`${API_URL}/app-errors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        // ✅ read response properly
        const text = await res.text();
        console.log("📤 error sent:", res.status, text);

    } catch (e: any) {
        console.log('err msg -> ', e.response);
        console.log("❌ log send failed:", e?.message);
    }
};

const normalizeStack = (stack: any) => {
    if (!stack) return "";
    if (typeof stack === "string") return stack;
    return JSON.stringify(stack);
};

const getRouteName = () => {
    return (global as any).__CURRENT_ROUTE__ || "unknown";
};

export const initErrorTracking = () => {
    if (!(global as any).ErrorUtils) {
        console.warn("ErrorUtils not available");
        return;
    }

    const prev = (global as any).ErrorUtils.getGlobalHandler();

    // ✅ SINGLE global handler
    (global as any).ErrorUtils.setGlobalHandler(
        (error: any, isFatal?: boolean) => {
            const payload = {
                message: error?.message || "Unknown error",
                stack: normalizeStack(error?.stack),
                is_fatal: !!isFatal,
                platform: Platform.OS,
                app_version: "1.0.0",
                screen: getRouteName(),
                created_at: new Date().toISOString(),
                type: "JS_CRASH",
            };

            sendErrorToServer(payload);

            if (prev) prev(error, isFatal);
        }
    );

    // ✅ Promise tracking
    const tracking = require("promise/setimmediate/rejection-tracking");
    tracking.enable({
        allRejections: true,
        onUnhandled: (id: any, error: any) => {
            sendErrorToServer({
                message: error?.message,
                stack: normalizeStack(error?.stack),
                type: "PROMISE_ERROR",
                created_at: new Date().toISOString(),
            });
        },
    });
};