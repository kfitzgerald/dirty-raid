
// Action to emit when a fatal error occurs - app can show a crash screen
export const APP_CRASH = 'APP_CRASH';
export function crashApp(error, errorInfo) {
    return {
        type: APP_CRASH,
        error,
        errorInfo
    };
}