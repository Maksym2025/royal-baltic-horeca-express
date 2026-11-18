import {publicContent,publicComments} from '@/lib/server/content';
import {RecipeArticle} from '@/components/recipe-blog';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const r=(await publicContent()).find(x=>x.kind==='recipe'&&x.slug===slug);return {title:r?r.translations.fr?.title+' | Royal Baltic':'Recette introuvable'};}
export default async function RecipePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const r=(await publicContent()).find(x=>x.kind==='recipe'&&x.slug===slug);if(!r)notFound();return <RecipeArticle recipe={r} initialComments={await publicComments(slug)}/>;}
