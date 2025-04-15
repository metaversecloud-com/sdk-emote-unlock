# Emote Unlock App

## Introduction / Summary

The Emote Unlock App allows users to unlock new emotes by completing specific actions or challenges in the world. Admins can configure which emotes are available to unlock and set the conditions for unlocking them. Once unlocked, users can use these emotes to enhance their interaction experience in the world.

## Key Features

### Canvas elements & interactions

- Key Asset: When clicked, this asset opens the app in the drawer and allows both admins and users to interact with the emote unlock system.

### Drawer content

#### User View:

- Displays available emotes that can be unlocked
- Shows unlock progress and requirements
- Provides visual feedback when emotes are successfully unlocked
- Allows users to view their currently unlocked emotes

#### Admin View:

- Accessible via a settings icon on the main page
- Contains emote configuration options and admin-specific interactions (see below)

### Admin features

- Access:
  - When the admin clicks on the key asset, the app opens in the drawer
  - A settings icon on the main page leads to the admin configuration page
- Emote Configuration:
  - Configure which emotes are available for unlocking
  - Set unlock conditions and requirements
  - Manage particle effects for unlock celebrations
  - View unlock statistics and user progress

### Data objects

- Key Asset: the data object attached to the dropped key asset will store information related to this specific implementation of the app and would be deleted if the key asset is removed from world. Example data:
  ```typescript
  {
    availableEmotes: string[];
    unlockedEmotes: { [profileId: string]: string[] };
    unlockConditions: { [emoteId: string]: { condition: string, requirement: any } };
    particleEffects: { [emoteId: string]: { type: string, config: any } };
  }
  ```

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
