// Fallback `cn` utility since tailwind-merge and clsx cannot be installed due to EPERM.
// It simply joins valid string classes and filters out falsy values.
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
