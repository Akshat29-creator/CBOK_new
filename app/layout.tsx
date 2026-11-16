import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LLM Next-Word Lab | Next Token Prediction Visualizer',
  description: 'Interactive visualization of LLM next-token generation and sampling stages with local Ollama models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 min-h-screen antialiased selection:bg-accent-blue/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
