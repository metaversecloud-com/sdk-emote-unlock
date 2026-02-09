# Emote Unlock

## Introduction / Summary

Emote Unlock enables admins to create password-protected challenges within Topia worlds that allow users to unlock custom emotes. Users view an emote preview, read a challenge question, and enter a password/answer to unlock the emote expression for their avatar.

## Built With

### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

## Key Features

### User Features

- **Challenge View**: See emote preview, question/description, and password input
- **Emote Unlocking**: Enter correct password to permanently unlock the emote expression
- **Visual Feedback**: Toast notifications and sparkle particle effects on successful unlock
- **Progress Tracking**: Shows if you've already unlocked the emote

### Canvas Elements & Interactions

- **Key Asset**: When clicked, opens the drawer showing the emote challenge interface

### Admin Features

- **Access**: Click on the key asset to open the drawer and select the Admin gear icon
- **Emote Selection**: Choose from available unlockable emotes in the world
- **Challenge Configuration**:
  - Set the question/description text
  - Set the password (case-insensitive)
- **Engagement Metrics**: View attempt counts and successful unlock statistics

### Data Objects

**Dropped Asset Data Object**:

```typescript
{
  emoteId: string,              // SDK emote expression ID
  emoteName: string,            // Display name of emote
  emotePreviewUrl: string,      // S3 URL to emote preview image
  emoteDescription: string,     // Challenge question/description
  password: string,             // Answer (stored lowercase)
  stats: {
    attempts: number,           // Total failed attempts
    successfulUnlocks: {
      [profileId]: {
        displayName: string,
        unlockedAt: string      // ISO date string
      }
    }
  }
}
```

### Implementation Details

- **Password Validation**: Case-insensitive (converted to lowercase)
- **Particle Effect**: "Sparkle" effect triggered for 3 seconds on unlock
- **Toast Messages**: "Congrats! Emote Unlocked" or "Already Unlocked"
- **S3 Storage**: Emote preview images stored in S3 bucket

## Developers

### Getting Started

- Clone this repository
- Run `npm i` in server
- `cd client`
- Run `npm i` in client
- `cd ..` back to server

### Add your .env environmental variables

```
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
S3_BUCKET=sdk-emunlock
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
