import "./globals.css";

export const metadata = {
  title: "Saoudi Accessoires | L'élégance qui te complète",
  description: "Boutique d'accessoires.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark scroll-smooth">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                  darkMode: 'class',
                  theme: {
                      extend: { colors: { gold: '#D4AF37' } }
                  }
              }
            `,
          }}
        />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
