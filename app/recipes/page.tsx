import {publicContent} from '@/lib/server/content';
import {RecipeBlog} from '@/components/recipe-blog';
export const dynamic='force-dynamic';
export const metadata={title:'Recettes | Royal Baltic HoReCa Express'};
export default async function RecipesPage(){return <RecipeBlog items={(await publicContent()).filter(x=>x.kind==='recipe')}/>;}
