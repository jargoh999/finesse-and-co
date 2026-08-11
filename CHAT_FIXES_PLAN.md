# Personal Chat & Anonymous DM Fixes & Features

This document details the plan and fixes requested for the chat platform.

## Summary of Fixes & Enhancements

1. **Private Mode Emoji & Link Disappearance**
   - Fixed rendering in `PersonalChat.tsx` when Private Mode is active.
   - When messages expire after 2 minutes, text, links, and emojis hide cleanly (`opacity: 0`, `pointer-events: none`).

2. **Blocked User Reflection on Conversation List**
   - Updated `/api/conversations` to return `isBlocked` state for participants.
   - Updated `ConversationList.tsx` to display a red "Blocked" badge on blocked conversations.

3. **Remove Unread Message Count Badge**
   - Updated `ConversationList.tsx` to remove numeric unread badges and only display the last message.

4. **Real-time Immediate Message Indication**
   - Added instant parent conversation list updates when messages are sent/received in `PersonalChat.tsx` and `page.tsx`.

5. **Media Deletion & Cloudinary Cleanup**
   - Enabled context menu & multi-select checkbox on media attachments (images, video, audio, files).
   - Updated `/api/personal-messages` DELETE handler to purge media files from Cloudinary storage.

6. **Anonymous Chat Media Upload & Deletion**
   - Enabled Paperclip upload button in `AnonymousDMConversation.tsx`.
   - Added `/api/anonymous-dm/upload` endpoint for Cloudinary media uploads.
   - Added `DELETE` route in `/api/anonymous-dm` to delete messages and destroy media on Cloudinary.

7. **Anonymous Chat Body Height Fix**
   - Set `min-h-[350px]` and flex container sizing on `AnonymousDMConversation.tsx` so the body maintains reasonable height before text is entered.
