import Image from "next/image";

interface LogoProps {
  size?: number;
  alt?: string;
  className?: string;
}

export default function Logo({
  size = 32,
  alt = "Finder logo",
  className = "",
}: LogoProps) {
  return (
    <Image
      src="/brand/finder-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
