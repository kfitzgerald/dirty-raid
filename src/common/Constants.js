export const DEFAULT_PREFERENCES = {
    showTitles: true,
    showTags: true,
    showProfileImg: true,
    showAmPm: true,
    showRaidPalCreatedEvents: false,
    raidChatMessageEnabled: false,
    raidChatMessage: 'Thank you for watching! We are raiding over to {Target}, should you be left behind, please click here: https://twitch.tv/{target}',
    raidChatMessageSendAsAnnouncement: false,
};

// Auth: see https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow
// Scopes we need:
export const REQUIRED_SCOPES = [
    'user:read:follows',                // so we can see live followed channels
    'channel:manage:raids',             // so we can start/stop raids
    'moderator:manage:announcements',   // so we can send messages to chat (pre-chat api)
    'user:write:chat',                  // so we can sent chat messages
];
