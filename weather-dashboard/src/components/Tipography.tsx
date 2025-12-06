import type { ReactNode, ElementType } from "react";

type TipographyVariant = "h1" | "h2" | "h3" | "p" | "span" | "alert";

type TipographyProps = {
  variant: TipographyVariant;
  children: ReactNode;
  className?: string;
};

export default function Tipography({
  variant,
  children,
  className,
}: TipographyProps) {
  const variants = {
    h1: "text-4xl font-poppins font-bold text-gray-900",
    h2: "text-3xl font-poppins font-bold text-gray-900",
    h3: "text-2xl font-poppins font-bold text-gray-900",
    p: "font-medium text-gray-700 font-inter",
    span: "text-gray-600 font-ligth font-inter",
    alert: "text-red-600 font-medium font-inter",
  };

  const tagMap: Record<TipographyVariant, ElementType> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    p: "p",
    span: "span",
    alert: "p", 
  };

  const Tag = tagMap[variant];  

  return (
    <Tag className={`${variants[variant]} ${className ?? ""}`}>{children}</Tag>
  );
}