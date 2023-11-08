import { inter } from "./ui/fonts";
import "./ui/global.css";
import cx from "classnames";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let bodyClasses = cx(inter.className, `antialiased`);
  return (
    <html lang="en">
      <body className={bodyClasses}>{children}</body>
    </html>
  );
}
