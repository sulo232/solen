import React from "react";
import { act, create } from "react-test-renderer";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";
const h=vi.hoisted(()=>({session:vi.fn(),fetch:vi.fn(),locale:"en",recent:[] as any[]}));
vi.mock("@/lib/supabase-browser",()=>({createBrowserSupabaseClient:()=>({auth:{getSession:h.session}})}));
vi.mock("@/app/[locale]/_components/homepage/useRecentSearches",()=>({useRecentSearches:()=>({recent:h.recent}),recentLabel:(s:any)=>s.query}));
vi.mock("next-intl",async()=>{const {createTranslator}=await import("use-intl/core");return {NextIntlClientProvider:({children}:any)=>children,useLocale:()=>h.locale,useTranslations:(namespace:string)=>createTranslator({locale:h.locale,messages:{de,en,fr,it}[h.locale as "en"],namespace:namespace as any})};});
vi.mock("@/app/[locale]/inspo/InspoPageClient",()=>({default:()=>null}));
vi.mock("next/link",()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.mock("next/image",()=>({default:(props:any)=><img {...props}/>}));
vi.mock("mapbox-gl",()=>({default:{}}));
vi.mock("motion/react",()=>({motion:{div:({children,initial,animate,transition,...props}:any)=><div {...props}>{children}</div>}}));
vi.mock("next-intl/server",()=>({unstable_setRequestLocale:()=>{},getTranslations:async({locale,namespace}:any)=>{const data:any={de,en,fr,it}[locale];const value=namespace.split(".").reduce((v:any,k:string)=>v[k],data);return (key:string)=>value[key];}}));
import MapView from "@/components-legacy/MapView";
import ContinueCard from "@/app/[locale]/_components/homepage/ContinueCard";
import RootError from "@/app/error";
import LocaleError from "@/app/[locale]/error";
import InspoPage,{generateMetadata} from "@/app/[locale]/inspo/page";
import InspoPageClient from "@/app/[locale]/inspo/InspoPageClient";
import {detectLocaleFromPathname} from "@/lib/detect-locale";
let tree:any;
const messages={de,en,fr,it};
const text=(n:any):string=>typeof n==="string"?n:Array.isArray(n)?n.map(text).join(" "):n?.children?text(n.children):"";
async function mount(node:React.ReactNode,locale="en") {h.locale=locale;await act(async()=>{tree=create(<NextIntlClientProvider locale={locale} messages={messages[locale as keyof typeof messages]} timeZone="Europe/Zurich">{node}</NextIntlClientProvider>)});}
beforeEach(()=>{vi.stubGlobal("React",React);vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);vi.stubGlobal("fetch",h.fetch);h.fetch.mockReset();h.session.mockReset().mockResolvedValue({data:{session:null},error:null});h.recent=[];vi.spyOn(console,"error").mockImplementation(()=>{});});
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;vi.restoreAllMocks();vi.unstubAllGlobals();});
test("anonymous visitor retains recent search without auth-only API request",async()=>{h.recent=[{query:"Haircut",city:"basel"}];await mount(<ContinueCard/>);expect(h.fetch).not.toHaveBeenCalled();expect(text(tree.toJSON())).toContain("Haircut");expect(tree.root.findByType("a").props.href).toBe("/en/search?q=Haircut&city=basel");});
test("anonymous without recent search remains hidden",async()=>{await mount(<ContinueCard/>);expect(tree.toJSON()).toBeNull();expect(h.fetch).not.toHaveBeenCalled();});
test("signed-in visitor loads actual upcoming booking and keeps locale destination",async()=>{h.session.mockResolvedValue({data:{session:{user:{id:"fixture"}}},error:null});h.fetch.mockResolvedValue(new Response(JSON.stringify({bookings:[{starts_at:"2026-09-10T10:00:00Z",salon:{name:"Fixture Store",slug:"fixture"},service:{name_de:"Schnitt",name_en:"Cut"}}]})));await mount(<ContinueCard/>);expect(h.fetch).toHaveBeenCalledExactlyOnceWith("/api/bookings/user?tab=upcoming");expect(text(tree.toJSON())).toContain("Fixture Store");expect(tree.root.findByType("a").props.href).toBe("/en/salon/fixture");});
test("session failure logs and keeps recent fallback without bookings request",async()=>{h.recent=[{query:"Haircut"}];h.session.mockResolvedValue({data:{session:null},error:new Error("session fixture")});await mount(<ContinueCard/>);expect(h.fetch).not.toHaveBeenCalled();expect(console.error).toHaveBeenCalledWith("[ContinueCard] failed to load upcoming booking:",expect.any(Error));expect(text(tree.toJSON())).toContain("Haircut");});
test("unmount while session resolves never starts a late request",async()=>{let resolve:any;h.session.mockReturnValue(new Promise(r=>resolve=r));await mount(<ContinueCard/>);await act(async()=>tree.unmount());tree=null;await act(async()=>resolve({data:{session:{user:{id:"fixture"}}}}));expect(h.fetch).not.toHaveBeenCalled();});
for(const locale of ["de","en","fr","it"] as const){
 test(`${locale} root error loads existing locale copy, logs, retries and links home`,async()=>{vi.stubGlobal("window",{location:{pathname:`/${locale}/contact`}});const reset=vi.fn();const error=new Error("private diagnostic");await mount(<RootError error={error} reset={reset}/>);await vi.waitFor(()=>expect(text(tree.toJSON())).toContain(messages[locale].ui.error.title));expect(text(tree.toJSON())).toContain(messages[locale].ui.error.defaultMessage);expect(text(tree.toJSON())).not.toContain("private diagnostic");expect(tree.root.findByType("a").props.href).toBe(`/${locale}`);await act(async()=>tree.root.findByType("button").props.onClick());expect(reset).toHaveBeenCalledOnce();expect(console.error).toHaveBeenCalledWith("App error:",error);});
 test(`${locale} shared segment boundary invokes existing fallback and reset`,async()=>{const reset=vi.fn();const error=new Error("English framework diagnostic");await mount(<LocaleError error={error} reset={reset}/>,locale);expect(text(tree.toJSON())).toContain(messages[locale].ui.error.defaultMessage);expect(text(tree.toJSON())).not.toContain("English framework diagnostic");expect(console.error).toHaveBeenCalledWith("[ErrorFallback]",error);await act(async()=>tree.root.findByType("button").props.onClick());expect(reset).toHaveBeenCalledOnce();});
 test(`${locale} Inspo metadata uses its existing translated owner and canonical`,async()=>{const m=await generateMetadata({params:Promise.resolve({locale})});expect(m.title).toBe(messages[locale].discovery.meta.title);expect(m.description).toBe(messages[locale].discovery.meta.description);expect(m.alternates?.canonical).toBe(`https://solen.ch/${locale}/inspo`);expect(Object.keys(m.alternates?.languages??{})).toEqual(expect.arrayContaining(["de","en","fr","it","x-default"]));});
}
test.each([["/fr","fr"],["/it/salon/x","it"],["/english","de"],["/france/x","de"],["/","de"],["","de"],["/xx/contact","de"]])("locale boundary %s resolves %s",(p,l)=>expect(detectLocaleFromPathname(p)).toBe(l));
test("Inspo server page composes the unchanged client without adding a heading or wrapper",()=>{expect(InspoPage().type).toBe(InspoPageClient);expect(InspoPage().props).toEqual({});});

class TriggerBoundary extends React.Component<{children:React.ReactNode},{error:Error|null}> {
 state={error:null as Error|null};
 static getDerivedStateFromError(error:Error){return {error};}
 render(){return this.state.error?<LocaleError error={this.state.error} reset={()=>this.setState({error:null})}/>:this.props.children;}
}
test("a thrown child reaches the locale boundary; a healthy child remains unchanged",async()=>{
 let shouldThrow=false;
 function Child(){if(shouldThrow)throw new Error("");return <p>Healthy child</p>;}
 await mount(<TriggerBoundary><Child/></TriggerBoundary>,"fr");
 expect(text(tree.toJSON())).toBe("Healthy child");
 shouldThrow=true;
 await act(async()=>tree.update(<TriggerBoundary><Child/></TriggerBoundary>));
 expect(text(tree.toJSON())).toContain(fr.ui.error.title);
 shouldThrow=false;
 await act(async()=>tree.root.findByType("button").props.onClick());
 expect(text(tree.toJSON())).toBe("Healthy child");
});

test.each([0,2])("map region exposes its real %s result count",async count=>{
 const rows=Array.from({length:count},(_,i)=>({id:String(i),name:"Fixture",latitude:47,longitude:7}));
 await mount(<MapView salons={rows as any} selectedId={null} onSelect={()=>{}}/>);
 expect(tree.root.findByProps({role:"region"}).props["aria-label"]).toContain(String(count));
 expect(h.fetch).not.toHaveBeenCalled();
});
test("actual homepage server result emits both escaped schema blocks",async()=>{
 const root="@/app/[locale]/_components/";
 for(const name of ["Hero","HomeSearchPill","MobileCategoriesRow","ForYouSalonRows","ContinueCard","SalonOfMonth","ForYouAffinityRow","RecentlyViewed","Nearby","TopCategoryRails","WalkInBand","BusinessTeaser","Reviews","dynamic/PopularLooksLazy"]){vi.doMock(root+"homepage/"+name,()=>({default:()=>null}));}
 vi.doMock(root+"layout/CategoryPillRow",()=>({default:()=>null}));
 vi.doMock(root+"homepage/SectionHeader",()=>({FeedZone:({children}:any)=>children}));
 vi.doMock(root+"homepage/forYouSalons",()=>({FORYOU_SALONS:{}}));
 vi.doMock(root+"homepage/nearbySalonIds",()=>({NEARBY_SALON_IDS:[]}));
 vi.doMock(root+"homepage/salonCardData",()=>({getSalonCardDataMap:async()=>({}),getTopSalonIds:async()=>[],getNearbyTeaserCount:async()=>0,getTopSalonIdsByCategory:async()=>({})}));
 const {default:Page}=await import("@/app/[locale]/page");
 for(const locale of ["de","en","fr","it"]){
  const result=await Page({params:Promise.resolve({locale})});
  const scripts=React.Children.toArray(result.props.children).filter((n:any)=>n.type==="script") as React.ReactElement<any>[];
  expect(scripts).toHaveLength(2);
  const payloads=scripts.map(s=>JSON.parse(s.props.dangerouslySetInnerHTML.__html));
  expect(payloads.map(p=>p["@type"])).toEqual(["WebSite","Organization"]);
  expect(payloads.every(p=>p.url===`https://solen.ch/${locale}`)).toBe(true);
 }
});

test("city and category metadata preserve active-route gates and current client owner props",async()=>{
 let active=true;
 const filters=vi.fn(async()=>({fixture:true}));
 vi.doMock("next/navigation",()=>({notFound:()=>{throw new Error("NEXT_NOT_FOUND_FIXTURE")}}));
 vi.doMock("@/lib/cities",()=>({getActiveCityBySlug:async()=>active?{id:"fixture-city",slug:"basel"}:null,getActiveCities:async()=>[],getCityName:()=>"Fixture </script> City"}));
 vi.doMock("@/lib/search/filter-availability",()=>({getFilterAvailability:filters}));
 vi.doMock("@/components-legacy/CityPage",()=>({default:()=>null}));
 vi.doMock("@/app/[locale]/_components/search/SearchTemplate",()=>({default:()=>null}));
 const city=await import("@/app/[locale]/[city]/page");
 const category=await import("@/app/[locale]/[city]/[category]/page");
 for(const locale of ["de","en","fr","it"]){
  for(const owner of [city,category]){
   const result=await owner.default({params:Promise.resolve({locale,city:"basel",category:"nails"})});
   const children=React.Children.toArray(result.props.children) as React.ReactElement<any>[];
   const script=children.find(n=>n.type==="script")!;
   expect(script.props.dangerouslySetInnerHTML.__html).not.toContain("</script>");
   const payload=JSON.parse(script.props.dangerouslySetInnerHTML.__html);
   expect(payload["@type"]).toBe("BreadcrumbList");
   expect(payload.itemListElement[0].item).toBe(`https://solen.ch/${locale}`);
   expect(children[1].props.locale).toBe(locale);
  }
 }
 const count=filters.mock.calls.length;active=false;
 for(const owner of [city,category])await expect(owner.default({params:Promise.resolve({locale:"en",city:"missing",category:"nails"})})).rejects.toThrow("NEXT_NOT_FOUND_FIXTURE");
 active=true;
 await expect(category.default({params:Promise.resolve({locale:"en",city:"basel",category:"invalid"})})).rejects.toThrow("NEXT_NOT_FOUND_FIXTURE");
 expect(filters.mock.calls.length).toBe(count);
 expect(h.fetch).not.toHaveBeenCalled();
});

test("installed Next inheritance keeps feed metadata off boards and preserves item canonicals",async()=>{
 const {createRequire,default:Module}=await import("node:module");
 const {existsSync}=await import("node:fs");
 const req=createRequire(import.meta.url);
 const aliases=req("next/dist/build/create-compiler-aliases").createServerOnlyClientOnlyAliases(true);
 const resolver=(Module as any)._resolveFilename;
 let accumulateMetadata:any;
 try {
  // Match Next's installed server compilation alias for this server-only resolver.
  (Module as any)._resolveFilename=function(id:string,parent:any,...rest:any[]){return resolver.call(this,id==="server-only"?req.resolve(aliases["server-only$"]):id,parent,...rest);};
  accumulateMetadata=req("next/dist/lib/metadata/resolve-metadata").accumulateMetadata;
 } finally {(Module as any)._resolveFilename=resolver;}
 expect(existsSync(new URL("../../app/[locale]/inspo/layout.tsx",import.meta.url))).toBe(false);
 vi.doMock("@/lib/supabase",()=>({createServerSupabaseClient:async()=>({from:()=>{const q:any={select:()=>q,eq:()=>q,single:async()=>({data:{id:"fixture-item",style_name:"Fixture",description_en:"Fixture description"}})};return q;}}),createAdminSupabaseClient:()=>{throw new Error("unexpected admin access")}}));
 vi.doMock("@/components-legacy/discovery/DetailPage",()=>({default:()=>null}));
 vi.doMock("@/lib/ai-vision",()=>({analyzeDiscoveryImage:vi.fn(),analyzeDiscoveryTikTok:vi.fn()}));
 vi.doMock("@/lib/ratelimit",()=>({}));
 vi.doMock("@/lib/env",()=>({getServerEnv:()=>{throw new Error("unexpected environment access")}}));
 const item=await import("@/app/[locale]/inspo/[id]/page");
 const results:any[]=[];
 for(const locale of ["de","en","fr","it"]){
  const feedMeta=await generateMetadata({params:Promise.resolve({locale})});
  const itemMeta=await item.generateMetadata({params:Promise.resolve({locale,id:"fixture-item"})});
  // Root owns only title/description; locale and board segments have no metadata export.
  // Removing the Inspo layout leaves no feed metadata item in either descendant chain.
  const resolve=(pathname:string,leaf:any)=>accumulateMetadata([[null,null],[null,null],[leaf,null]],{pathname,trailingSlash:false,isStaticMetadataRouteFile:false});
  const feed=await resolve(`/${locale}/inspo`,feedMeta);
  const board=await resolve(`/${locale}/inspo/board/fixture-board`,null);
  const detail=await resolve(`/${locale}/inspo/fixture-item`,itemMeta);
  expect(feed.alternates.canonical.url).toBe(`https://solen.ch/${locale}/inspo`);
  expect(feed.openGraph.url.toString()).toBe(`https://solen.ch/${locale}/inspo`);
  expect(Object.values(feed.alternates.languages).flat().map((a:any)=>a.url)).toContain(`https://solen.ch/${locale}/inspo`);
  expect(board.alternates.canonical).toBeNull();
  expect(board.alternates.languages).toBeNull();
  expect(board.openGraph).toBeNull();
  expect(detail.alternates.canonical.url).toBe(`https://solen.ch/${locale}/inspo/fixture-item`);
  expect(Object.values(detail.alternates.languages).flat().every((a:any)=>a.url.endsWith("/inspo/fixture-item"))).toBe(true);
  expect(detail.openGraph.url?.toString()).not.toBe(`https://solen.ch/${locale}/inspo`);
  results.push({locale,feed:feed.alternates.canonical.url,boardCanonical:board.alternates.canonical,boardOpenGraph:board.openGraph,item:detail.alternates.canonical.url});
 }
 expect(results).toHaveLength(4);
});
