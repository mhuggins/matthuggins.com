import { WarningIcon } from "@phosphor-icons/react";
import { Section } from "./Section";

export const NotFound = () => (
  <div className="mx-auto max-w-3xl p-6">
    <Section title="Not Found" icon={WarningIcon}>
      The page you're looking for does not exist.
    </Section>
  </div>
);
