import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  ForkKnifeIcon,
  type Icon,
  InstagramLogoIcon,
  LinkSimpleIcon,
  MapPinIcon,
  PhoneIcon,
  PlayIcon,
  ShoppingCartSimpleIcon,
  StorefrontIcon,
  TicketIcon,
  WifiHighIcon,
} from "@phosphor-icons/react";

/** Sentinel ids the logo picker uses alongside the icon ids below. */
export const NO_LOGO = "none";
export const CUSTOM_LOGO = "custom";

export interface LogoOption {
  id: string;
  label: string;
  icon: Icon;
}

export const LOGO_OPTIONS: readonly LogoOption[] = [
  { id: "link", label: "Link", icon: LinkSimpleIcon },
  { id: "wifi", label: "Wi-Fi", icon: WifiHighIcon },
  { id: "email", label: "Email", icon: EnvelopeSimpleIcon },
  { id: "phone", label: "Phone", icon: PhoneIcon },
  { id: "download", label: "Download", icon: DownloadSimpleIcon },
  { id: "cart", label: "Shop", icon: ShoppingCartSimpleIcon },
  { id: "menu", label: "Menu", icon: ForkKnifeIcon },
  { id: "ticket", label: "Ticket", icon: TicketIcon },
  { id: "calendar", label: "Event", icon: CalendarBlankIcon },
  { id: "map", label: "Location", icon: MapPinIcon },
  { id: "store", label: "Storefront", icon: StorefrontIcon },
  { id: "play", label: "Play", icon: PlayIcon },
  { id: "instagram", label: "Instagram", icon: InstagramLogoIcon },
];

export function findLogoOption(id: string): LogoOption | undefined {
  return LOGO_OPTIONS.find((option) => option.id === id);
}
