/** Shared max width for dashboard header, main content, and banners. */
export const DASHBOARD_CONTENT_CLASS =
  "mx-auto w-full max-w-screen-2xl px-4 md:px-8";

/** Outer panel card — leaderboard rankings and data collection tables. */
export const MAIN_PANEL_CARD_CLASS = "w-full";

/** Body height sized for 10 leaderboard rows per column. */
export const PANEL_BODY_HEIGHT_CLASS = "h-[min(480px,60vh)]";

/** One leaderboard column — min height for ~10 rows, grows with content. */
export const LEADERBOARD_COLUMN_CLASS =
  "flex min-h-[420px] flex-col gap-3 pe-1 sm:pe-2";

/** List area inside a leaderboard column. */
export const LEADERBOARD_LIST_CLASS = "min-h-[360px] flex-1 gap-2";
