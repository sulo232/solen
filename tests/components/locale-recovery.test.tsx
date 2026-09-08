import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, test, vi } from 'vitest';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it from '@/messages/it.json';
const h=vi.hoisted(()=>({locale:'fr',messages:{} as any,error:'',toast:vi.fn(),navigate:vi.fn(),session:false}));
vi.mock('next-intl',async()=>{
 const actual=await vi.importActual<any>('next-intl');
 return {...actual,useLocale:()=>h.locale,useTranslations:(namespace:string)=>actual.createTranslator({locale:h.locale,messages:h.messages,namespace})};
});
vi.mock('next/navigation',()=>({useRouter:()=>({push:h.navigate}),useSearchParams:()=>new URLSearchParams()}));
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.mock('@/app/[locale]/_components/primitives/Toast',()=>({toast:{error:h.toast}}));
vi.mock('@/app/[locale]/_components/primitives/WelcomeToast',()=>({WELCOME_FLAG:'fixture-welcome'}));
vi.mock('@/lib/supabase-browser',()=>({createBrowserSupabaseClient:()=>({auth:{
 getSession:async()=>({data:{session:h.session?{}:null}}),
 signInWithPassword:async()=>({data:{session:null},error:{message:h.error}}),
 updateUser:async()=>({error:null}),
}})}));
import SignIn from '@/components-legacy/auth/SignIn';
import Spinner from '@/components-legacy/ui/Spinner';
import ResetPasswordPage from '@/app/[locale]/auth/reset-password/page';
beforeEach(()=>{
 h.locale='fr';h.messages=fr;h.error='invalid login credentials';h.session=false;vi.clearAllMocks();
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('window',{sessionStorage:{setItem:vi.fn(),removeItem:vi.fn()},location:{replace:h.navigate}});
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({})})));
});
const text=(tree:any)=>JSON.stringify(tree.toJSON());
test.each([['de',de],['en',en],['fr',fr],['it',it]])('actual %s sign-in labels, password toggle, error and reset flow use translated keys',async(locale,messages)=>{
 h.locale=locale as string;h.messages=messages;let tree:any;
 await act(async()=>{tree=create(<SignIn/>);});
 expect(text(tree)).toContain(h.messages.auth.login_title);
 let password=tree.root.findAllByType('input').find((n:any)=>n.props.type==='password');
 expect(password.props['aria-label']).toBe(h.messages.auth.password_placeholder);
 const toggle=tree.root.findAllByType('button').find((n:any)=>n.props['aria-label']===h.messages.auth.show_password);
 await act(async()=>{toggle.props.onClick();});
 expect(tree.root.findAllByType('input')[1].props.type).toBe('text');
 await act(async()=>{await tree.root.findByType('form').props.onSubmit({preventDefault(){}});});
 expect(h.toast).toHaveBeenCalledWith(h.messages.auth.error_invalid_credentials);
 const reset=tree.root.findAllByType('button').find((n:any)=>n.children.includes(h.messages.auth.forgot_password));
 await act(async()=>{reset.props.onClick();});
 expect(text(tree)).toContain(h.messages.auth.send_reset_link);
 await act(async()=>{await tree.root.findByType('form').props.onSubmit({preventDefault(){}});});
 expect(text(tree)).toContain(h.messages.auth.reset_link_sent_title);
 expect(fetch).toHaveBeenCalledTimes(1);
 await act(async()=>tree.unmount());
});
test.each([['fr',fr],['it',it]])('actual %s missing recovery link and spinner announce translated state',async(locale,messages)=>{
 h.locale=locale as string;h.messages=messages;let tree:any;
 await act(async()=>{tree=create(<ResetPasswordPage/>);});
 expect(text(tree)).toContain(h.messages.auth.link_expired_title);
 expect(text(tree)).toContain(h.messages.auth.request_new_link);
 expect(tree.root.findAllByType('form')).toHaveLength(0);
 await act(async()=>tree.unmount());
 await act(async()=>{tree=create(<Spinner/>);});
 expect(tree.root.findByProps({role:'status'}).props['aria-label']).toBe(h.messages.common.loading);
 await act(async()=>tree.unmount());
});
