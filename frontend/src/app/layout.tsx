import { AgeGateProvider } from "@/context/AgeGateContext";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { poppins } from "@/fonts";

export const metadata = {
  title: "SavrLeaf",
  description: "The First Cannabis Platform for Discounts Only",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.className} w-full max-w-full overflow-x-hidden`}>
      <body className="antialiased w-full max-w-full">
        <AuthProvider>
          <AgeGateProvider>{children}</AgeGateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
