# FoodShare

**FoodShare** is a Next.js web application that helps campus communities share and discover local food events. Users can view events on an interactive map, filter by food type and time, and report new food events by placing pins. The platform is built with React, Next.js, Firebase (Firestore), and Mapbox.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Authentication**: Sign in with Google or email/password (Firebase Auth).
- **Interactive Map**: View all upcoming food events as pins on a Mapbox map.
- **Sidebar Event List**: Browse and expand event details in a left sidebar.
- **Report Food Events**: Click on the map to place a pin and submit a new event via a form.
- **Event Categories**: Tag events as "mains", "desserts", or "drinks".
- **Filtering**: Filter events by food type, date (today), and time (AM/PM, hour).
- **Live Event Highlighting**: Ongoing events are marked as "LIVE".
- **Past Events Tab**: View previous events in a separate tab.
- **Bookmarks**: Bookmark events for quick access.
- **Edit/Delete**: Event creators can edit or delete their own events.
- **Persistent Filters**: User filter preferences are saved to Firestore.
- **Responsive Design**: Modern, mobile-friendly UI.

---

## Screenshots

> _Add screenshots or a GIF here to showcase the UI and features._

---

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React](https://react.dev/)
- **Database & Auth**: [Firebase Firestore](https://firebase.google.com/docs/firestore), [Firebase Auth](https://firebase.google.com/docs/auth)
- **Map**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- **Styling**: CSS Modules, modern system fonts
- **Icons**: [Lucide](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)

---

## Project Structure

```
app/
  components/
    Auth/           # Authentication logic and UI
    Map/            # Mapbox map component
    ReportForm/     # Event reporting form
    types.ts        # Shared TypeScript types
  map/              # Map page (main app UI)
  page.tsx          # Home/landing page
  HomePage.module.css
  ...
firebaseConfig.ts   # Firebase initialization
public/             # Static assets (logo, images)
...
```

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- A Firebase project (Firestore + Auth enabled)
- A Mapbox account (for API token)

### Usage

Access the project at: https://food-share-drab.vercel.app/

OR

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/foodshare-web.git
   cd foodshare-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root directory with the following:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

- **Sign in** with Google or email/password.
- **View events** on the map and in the sidebar.
- **Filter** events by food type, date, and time using the filter bar.
- **Click the map** to add a new event (pin) and fill out the report form.
- **Bookmark** events for later.
- **Edit or delete** your own events from the sidebar.
- **Switch tabs** to view upcoming or past events.

---

## Architecture

- **Authentication**: Managed by Firebase Auth, with context provided via a custom `AuthProvider`.
- **Data Storage**: All events ("pins") are stored in the Firestore `pins` collection. User filter preferences are stored in the `users` collection.
- **Map Rendering**: The `Map` component uses Mapbox GL JS to render pins and handle map interactions.
- **Event Reporting**: The `ReportForm` component collects event details and saves them to Firestore.
- **Filtering**: The filter bar at the top center allows multi-select and time-based filtering, with persistent user preferences.
- **UI State**: React state and hooks manage sidebar expansion, pin selection, editing, and more.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Mapbox](https://www.mapbox.com/)
- [date-fns](https://date-fns.org/)
- [Lucide Icons](https://lucide.dev/)

---

**FoodShare** – Connect, share, and never miss a free meal on campus!
