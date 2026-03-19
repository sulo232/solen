"use client";

import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-s-bg-base dark:bg-s-dm-bg text-dark dark:text-s-dm-text">
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
