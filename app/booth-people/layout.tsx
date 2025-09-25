import { Providers } from "@/components/providers";

export default function BoothPeopleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}