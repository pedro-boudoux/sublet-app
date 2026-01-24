# Sublet Tinder Tech Stack

## Tech & Purpose


|Component         |Technology           |Why?                                                             |
|------------------|---------------------|-----------------------------------------------------------------|
|App Wrapper       |Tauri (v2)           |Turns your web app into a lightweight .exe (Desktop App).        |
|Frontend Framework|React (via Vite)     |Fast HMR (Hot Module Reloading) and massive ecosystem.           |
|Hosting & Auth    |Azure Static Web Apps|Handles hosting + GitHub/Microsoft Login automatically.          |
|Backend Logic     |Azure Functions      |Serverless Node.js endpoints. No server management.              |
|Database          |Azure Cosmos DB      |NoSQL database. Perfect for dumping JSON data (profiles) quickly.|

### Frontend Dependencies
- `react-tinder-card`: Does the swiping stuff for us.
    - `<TinderCard onSwipe={onSwipe}... />`
- `react-hot-toast`: Notifications.
    - `toast.success('Matched!;)`
- `canvas-confetti`: Confetti explosion when match.
- `lucide-ract`: icon set.

#### Frontend Logic Dependencies
- `zustand`: Stores currentUser so we dont have to pass props down 10 layers, and the matches list. 
- `clsx` & `tailwind-merge`: Conditional classes for tailwind.
- `swr`: Data fetching hook that automatically caches data.

### Backend Dependencies
- `@azure/cosmos`: SDK Package to talk to our database.
- `@azure/functions`: Types and helpers for writing the serverless functions.
- `@uuid`: For generating unique IDs for users, swipes, and matches.

### Dev Tools
- `@azure/static-web-apps-cli`: Runs entire Azure cloud environment locally on our devices.
- `concurrently`: Lets us run Tauri and the Azure backend in one terminal command.
