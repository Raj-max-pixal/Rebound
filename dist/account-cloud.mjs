let client=null,user=null,generation=0;
const status=text=>{const out=document.getElementById('cloud-account-status');if(out)out.textContent=text;};
export async function recordActivity(event,screen=null){
 if(!client||!user)return;
 try{const {error}=await client.rpc('rebound_record_activity',{p_event:event,p_screen:screen});if(error)throw error;}catch{status('Account connected; activity sync unavailable.');}
}
async function loadProfile(){
 const expected=generation;
 const {data,error}=await client.from('rebound_profiles').select('*').eq('user_id',user.id).single();
 if(expected!==generation)return;
 if(error){status('Signed in. Profile database needs setup or is unavailable.');return;}
 status(`Signed in as ${user.email}. Last active: ${data.last_seen_at?new Date(data.last_seen_at).toLocaleString():'First visit'}`);
 const name=document.getElementById('m-profile-name');if(name)name.textContent=data.display_name||user.email.split('@')[0];
 if(data.avatar&&Object.keys(data.avatar).length){localStorage.setItem('reboundWardrobe',JSON.stringify(data.avatar));window.dispatchEvent(new Event('rebound:avatar-refresh'));}
 const list=document.getElementById('cloud-activity');if(!list)return;
 const result=await client.from('rebound_activity').select('event,screen,created_at').order('created_at',{ascending:false}).limit(15);
 if(expected!==generation)return;
 list.replaceChildren();for(const item of result.data||[]){const row=document.createElement('li');row.textContent=`${item.event.replaceAll('_',' ')}${item.screen?' · '+item.screen:''} — ${new Date(item.created_at).toLocaleString()}`;list.append(row);}
}
function mount(){
 const host=document.querySelector('[data-screen="account"]');if(!host)return;
 const existing=document.getElementById('cloud-account');if(existing){if(existing.parentElement!==host)host.prepend(existing);return;}
 const card=document.createElement('article');card.id='cloud-account';card.className='m-account-summary';
 card.innerHTML='<h3>Your account</h3><p id="cloud-account-status" role="status">Sign in to save your profile and app activity across devices. Activity records include screen visits and focus actions; no screen text or location is uploaded.</p><button id="cloud-login">Sign in / Create account</button> <button id="cloud-logout" hidden>Sign out</button><details><summary>Recent activity</summary><button id="cloud-refresh">Refresh history</button><ul id="cloud-activity"></ul></details>';
 host.prepend(card);
 const remove=document.createElement('button');remove.id='cloud-delete';remove.textContent='Delete account';remove.hidden=!user;card.append(remove);
 remove.onclick=async()=>{
  if(!user||!client)return;
  if(prompt('This permanently deletes your Rebound account, profile and cloud history. Type DELETE to confirm.')!=='DELETE')return;
  remove.disabled=true;status('Deleting your account…');
  try{const {error}=await client.functions.invoke('delete-account',{body:{confirmation:'DELETE'}});if(error)throw error;await client.auth.signOut({scope:'local'});status('Your account has been deleted.');}
  catch(error){status('Account was not deleted: '+error.message);}finally{remove.disabled=false;}
 };
 document.getElementById('cloud-logout').hidden=!user;
 document.getElementById('cloud-login').hidden=!!user;
 document.getElementById('cloud-login').onclick=()=>document.getElementById('authDialog')?.showModal();
 document.getElementById('cloud-logout').onclick=async()=>{if(!client)return;const {error}=await client.auth.signOut();if(error)status(error.message);};
 document.getElementById('cloud-refresh').onclick=()=>user?loadProfile():status('Sign in to see your history.');
}
window.addEventListener('rebound:auth',event=>{
 const before=user?.id;client=event.detail.client;user=event.detail.user;generation++;mount();
 const logout=document.getElementById('cloud-logout');if(logout)logout.hidden=!user;
 const login=document.getElementById('cloud-login');if(login)login.hidden=!!user;
 const remove=document.getElementById('cloud-delete');if(remove)remove.hidden=!user;
 if(!user){status('Signed out. Activity recording is off.');document.getElementById('cloud-activity')?.replaceChildren();return;}
 // Defer database work outside Supabase's auth callback.
 if(before!==user.id)setTimeout(async()=>{await loadProfile();await recordActivity('app_open');},0);
});
document.addEventListener('click',async e=>{
 const nav=e.target.closest('[data-go]');if(nav)recordActivity('screen_view',nav.dataset.go);
 if(e.target.closest('#m-start-timer'))recordActivity(document.getElementById('m-start-timer')?.textContent.includes('Pause')?'focus_start':'focus_pause','focus');
 if(e.target.closest('#m-save-profile')&&client&&user){
  const display_name=document.getElementById('m-profile-name-input').value.trim().slice(0,60);
  const birth_date=document.getElementById('m-profile-dob').value||null;
  const {error}=await client.from('rebound_profiles').update({display_name,birth_date}).eq('user_id',user.id);
  if(error)status('Profile saved on device, but cloud save failed: '+error.message);else{status('Profile saved to your account.');recordActivity('profile_saved','account');}
 }
 if(e.target.closest('#wardrobe-save')&&client&&user){
  try{const avatar=JSON.parse(localStorage.getItem('reboundWardrobe')||'{}');const {error}=await client.from('rebound_profiles').update({avatar}).eq('user_id',user.id);if(error)throw error;recordActivity('avatar_saved','account');}catch{status('Avatar saved on device; cloud save failed.');}
 }
});
setInterval(()=>{if(!document.hidden)recordActivity('heartbeat');},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)recordActivity('heartbeat');});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
setTimeout(mount,500);
window.addEventListener('rebound:mobile-ready',mount);
