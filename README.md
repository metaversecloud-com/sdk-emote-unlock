# Emote Unlock App

## Introduction / Summary

The Emote Unlock App allows users to unlock new emotes by entering the correct password. Admins can configure which emote is available to unlock and set the password required to unlock it. Once unlocked, users can use the emote to enhance their interaction experience in the world.

## Key Features

### Canvas elements & interactions

- Key Asset: When clicked, this asset opens the app in the drawer and allows both admins and users to interact with the emote unlock system.

### Drawer content

#### User View:

- Displays the available emote to unlock with preview image
- Shows the emote description and unlock requirements
- Provides a password input field for unlock attempts
- Shows visual feedback and particle effects on successful unlock
- Displays unlock statistics (number of users who have unlocked the emote)

#### Admin View:

- Accessible via a settings icon on the main page
- Contains emote configuration options and admin-specific interactions (see below)

### Admin features

- Access:
  - When the admin clicks on the key asset, the app opens in the drawer
  - A settings icon on the main page leads to the admin configuration page
- Emote Configuration:
  - Select an emote to make available for unlocking
  - Set a custom description for the unlock challenge
  - Set the password required to unlock the emote
  - View unlock statistics and user progress
  - See list of users who have successfully unlocked the emote

### Data objects

- Key Asset: the data object attached to the dropped key asset stores information related to this specific implementation of the app. Example data structure:
  ```typescript
  {
    unlockData: {
      emoteId: string; //ID of the emote
      emoteName: string; //display name of the emote 
      emotePreviewUrl: string; //URL to the emote's preview image
      emoteDescription: string; //custom description for the unlock challenge
      password: string; //required password (only visible to admin)
      stats: {//good for later use
        attempts: number; //total number of unlock attempts
        successfulUnlocks: number; //number of successful unlocks
        unlockUsers: Array<{
          //list of users who unlocked the emote
          visitorId: string;
          displayName: string;
          unlockedAt: string;
        }>;
      }
    }
  }
  ```

### Available Emotes

Currently, the following emotes are available for unlocking:

- [under construction]

### Particle Effects

When a user successfully unlocks an emote, a "Sparkle" particle effect is triggered for 3 seconds to celebrate their achievement.

## Developers:

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### Getting Started

- Clone this repository
- Run `npm i` in server
- `cd client`
- Run `npm i` in client
- `cd ..` back to server

### Add your .env environmental variables

```json
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- [View it in action!](topia.io/appname-prod)
- To see an example of an on canvas turn based game check out TicTacToe:
  - (github))[https://github.com/metaversecloud-com/sdk-tictactoe]
  - (demo))[https://topia.io/tictactoe-prod]
