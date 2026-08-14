import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Edulaepe Credit and Saving"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      priority
    />
  );
}
