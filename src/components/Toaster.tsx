"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
          background: "#1e2235",
          color: "#e8eaf0",
          fontSize: "14px",
          border: "1px solid rgba(124, 92, 252, 0.2)",
        },
        success: {
          iconTheme: { primary: "#00b894", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#ff6b6b", secondary: "#fff" },
          duration: 4000,
        },
      }}
    />
  );
}
