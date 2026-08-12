import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "success";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[#6d5cff] text-white hover:bg-[#5a4ce6] shadow-[0_6px_0_#4a3fd1]",
  success: "bg-[#06d6a0] text-white hover:bg-[#05c194] shadow-[0_6px_0_#04a87c]",
  secondary: "bg-white text-[#3a3352] border-2 border-[#eadff5] hover:border-[#6d5cff] shadow-[0_6px_0_#eadff5]",
  ghost: "bg-transparent text-[#8a7f9e] hover:text-[#6d5cff]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  size?: "md" | "lg";
}

/** Big, chunky, pressable button for kids. */
export function KidsButton({ variant = "primary", size = "lg", children, className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`rounded-full font-extrabold tracking-wide transition-all active:translate-y-1 active:shadow-none ${
        size === "lg" ? "px-8 py-4 text-lg" : "px-5 py-2.5 text-sm"
      } ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}