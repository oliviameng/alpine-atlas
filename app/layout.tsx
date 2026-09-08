import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Alpine Atlas — Zermatt',description:'Explore Zermatt through real terrain, mountain cameras, skier perspectives and local stories.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
