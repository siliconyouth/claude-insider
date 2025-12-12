// Root layout - pass-through to allow route groups to define their own html/body
// (main) route group handles the main site layout
// admin route uses Payload's RootLayout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
