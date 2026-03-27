import { createElement, type ComponentType, type ReactElement } from "react";
import * as lucideIcons from "lucide-react";
import * as phIcons from "@phosphor-icons/react";

type IconMap = Record<string, ComponentType<any>>;

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function Icon({
  name,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
}: IconProps): ReactElement {
  // Support "ph:icon-name" prefix for explicit Phosphor selection
  const [lib, iconName] = name.includes(":")
    ? (name.split(":", 2) as [string, string])
    : ["lucide", name];

  const pascalName = toPascalCase(iconName);

  if (lib === "ph") {
    const PhIcon = (phIcons as unknown as IconMap)[pascalName];
    if (PhIcon) {
      return createElement(PhIcon, { size, color, weight: "regular" });
    }
  } else {
    const LucideIcon = (lucideIcons as unknown as IconMap)[pascalName];
    if (LucideIcon) {
      return createElement(LucideIcon, { size, color, strokeWidth });
    }
  }

  // Fallback: empty placeholder
  return createElement("span", {
    style: { display: "inline-block", width: size, height: size },
  });
}
