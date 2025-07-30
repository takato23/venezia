# Notification Sounds

This directory should contain audio files for notification sounds:

- `notification.mp3` - Default notification sound (gentle ping/chime)
- `warning.mp3` - Warning notification sound (alert tone)
- `critical.mp3` - Critical notification sound (urgent alarm)

## Recommended Audio Properties:
- Format: MP3
- Duration: 1-3 seconds
- Volume: Moderate (users can control via system settings)
- Quality: 44.1kHz, 128kbps

## Audio Sources:
You can use free notification sounds from:
- [Freesound.org](https://freesound.org)
- [Zapsplat](https://www.zapsplat.com)
- Or create custom sounds

## Implementation:
These sounds are played by the `useNotifications` hook when notifications are received, based on user preferences and notification priority levels.