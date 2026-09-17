import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Royal Baltic · HoReCa Express',description:'Fisch und Meeresfrüchte für Ihre Küche. Der mobile B2B-Bestellkatalog von Royal Baltic.',manifest:'/manifest.json',icons:{icon:'/icon-192.png',apple:'/icon-192.png'},appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'Royal Baltic'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#0a1728',viewportFit:'cover'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="de"><body>{children}</body></html>}
