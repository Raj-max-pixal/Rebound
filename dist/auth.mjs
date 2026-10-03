const storageKey='rebound-auth-prompt-dismissed';
const basePath=location.pathname.replace(/[^/]*$/,'')||'/';
let config=null,client=null;
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11V5l-8-3Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5 10H7c.4-2.2 2.2-3.5 5-3.5s4.6 1.3 5 3.5Z"/></svg>';
function mount(){
 const header=document.querySelector('header .header-end');
 if(header&&!document.getElementById('accountButton')){const b=document.createElement('button');b.id='accountButton';b.className='quiet account-button';b.innerHTML=icon+'<span>Guest</span>';b.addEventListener('click',()=>open());header.prepend(b);}
 const dialog=document.createElement('dialog');dialog.id='authDialog';dialog.className='auth-dialog';dialog.innerHTML=`<form method="dialog" class="auth-shell"><button class="auth-close" value="cancel" aria-label="Close sign in">×</button><div class="auth-mark">${icon}</div><p class="eyebrow">YOUR REBOUND ACCOUNT</p><h2>Save your momentum.</h2><p id="authIntro">You can keep using Rebound as a guest. Sign in to use a confirmed account when cloud authentication is enabled.</p><div id="authUnavailable" class="auth-unavailable" hidden>Account sign-in is being connected. Guest mode is ready now.</div><label>Email<input id="authEmail" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com"></label><label>Password<input id="authPassword" type="password" autocomplete="current-password" minlength="8" maxlength="128" placeholder="At least 8 characters"></label><p class="auth-note">Passwords are sent only to Supabase for verification and are never saved by Rebound.</p><p id="authStatus" class="auth-status" role="status"></p><div class="auth-actions"><button type="button" class="primary" id="emailSignIn">Sign in</button><button type="button" class="quiet" id="emailSignUp">Create account</button></div><div class="auth-divider"><span>or</span></div><button type="button" class="auth-google" id="googleSignIn"><span>G</span> Continue with Google</button><button type="button" class="auth-guest" id="continueGuest">Continue as guest</button><p class="auth-foot">New accounts must confirm their email before they are fully activated.</p></form>`;
 document.body.append(dialog);
 dialog.addEventListener('close',()=>{try{localStorage.setItem(storageKey,'1')}catch{}});
 document.getElementById('continueGuest').onclick=()=>dialog.close();
 document.getElementById('emailSignIn').onclick=()=>signIn();
 document.getElementById('emailSignUp').onclick=()=>signUp();
 document.getElementById('googleSignIn').onclick=()=>google();
}
const status=message=>{document.getElementById('authStatus').textContent=message;};
const fields=()=>({email:document.getElementById('authEmail').value.trim(),password:document.getElementById('authPassword').value});
function usable(){return config?.enabled&&client;}
function setAvailability(){const unavailable=document.getElementById('authUnavailable');unavailable.hidden=usable();if(!usable())unavailable.textContent='Sign-in needs this project’s Supabase connection. Guest mode is available while it is configured.';}
function requireConnection(){if(usable())return true;status('Sign-in is not connected yet. Add SUPABASE_URL and SUPABASE_ANON_KEY in the live Site settings, then enable Email and Google in Supabase.');return false;}
function renderAccount(user){const b=document.getElementById('accountButton');if(!b)return;b.innerHTML=icon+`<span>${user?.email?'Account':'Guest'}</span>`;}
function open(){document.getElementById('authDialog').showModal();}
async function loadClient(){
 try{const response=await fetch('/api/auth-config',{cache:'no-store'});config=await response.json();if(config.enabled){const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');client=createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const {data:{session}}=await client.auth.getSession();renderAccount(session?.user);client.auth.onAuthStateChange((_event,session)=>renderAccount(session?.user));}}catch{config={enabled:false};}
 setAvailability();
}
async function signIn(){if(!requireConnection())return;const {email,password}=fields();if(!email||!password)return status('Enter your email and password.');status('Signing in…');const {data,error}=await client.auth.signInWithPassword({email,password});if(error)return status(error.message);renderAccount(data.user);status('Signed in. Your account is ready.');setTimeout(()=>document.getElementById('authDialog').close(),700);}
async function signUp(){if(!requireConnection())return;const {email,password}=fields();if(!email||password.length<8)return status('Use an email and a password with at least 8 characters.');status('Creating your account…');const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+basePath}});if(error)return status(error.message);renderAccount(data.user);status(data.session?'Account created.':'Check your inbox to confirm your email, then sign in.');}
async function google(){if(!requireConnection())return;status('Taking you to Google…');const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+basePath}});if(error)status(error.message);}
mount();
loadClient().finally(()=>{setTimeout(()=>{try{if(!localStorage.getItem(storageKey)&&!document.querySelector('#authDialog[open]'))open();}catch{open();}},2000);});
