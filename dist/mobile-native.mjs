import { nativeGuard } from './native-guard.mjs';
export function upgradeMobile(app, show) {
  // Load wardrobe CSS
  const css=document.createElement('link');css.rel='stylesheet';css.href='wardrobe.css';document.head.append(css);

  const native=window.Capacitor?.isNativePlatform();
  const guard=nativeGuard();
  const $=s=>app.querySelector(s);

  // Permission status notice
  const notice=document.createElement('p');notice.setAttribute('role','status');notice.className='m-hint';$('[data-screen="profile"]').prepend(notice);
  const say=text=>{notice.textContent=text;};

  // Wire Connect buttons (Usage Access + Accessibility)
  const permissions=[...app.querySelectorAll('.m-permission button')];
  const refresh=async()=>{
    if(!guard)return;
    try{
      const s=await guard.status();
      permissions[0].textContent=s.usage?'✓ Enabled':'Connect';
      permissions[1].textContent=s.accessibility?'✓ Enabled':'Connect';
      // Update Reels & Shorts count in block list
      const reelsBtn=app.querySelector('[data-block="Reels & Shorts"] span');
      if(reelsBtn) reelsBtn.textContent=`${s.scrolls} videos counted · ${s.accessibility?'Monitoring':'Connect Accessibility'} ›`;
      say(`Scroll Guard: ~${s.scrolls} short-video feeds detected. Counts depend on what each app exposes.`);
    }catch(e){say(e.message);}
  };

  permissions.forEach((button,i)=>button.onclick=async()=>{
    if(!guard){say('These permissions work in the installed Android APK.');return;}
    if(i===1&&!confirm('Rebound uses Android Accessibility to detect selected apps and show time-limit overlays. It does not read messages or screen text. Enable in Accessibility Settings?'))return;
    try{await guard.permissions({kind:i===0?'usage':'accessibility'});}catch(e){say(e.message);}
  });

  window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  refresh();

  // Wire app-limit block buttons to configure guard
  const appMap={
    'Instagram':['com.instagram.android'],
    'YouTube':['com.google.android.youtube'],
    'Reels & Shorts':['com.instagram.android','com.google.android.youtube'],
    'Facebook & Snapchat':['com.facebook.katana','com.snapchat.android','com.twitter.android','com.zhiliaoapp.musically','com.ss.android.ugc.trill']
  };

  $('#mStartWatch').onclick=async()=>{
    const name=$('#mGuardTitle').textContent;
    if(!appMap[name]){$('.m-dialog-note').textContent='Website filtering needs the browser extension, not available in APK.';return;}
    if(!guard){$('.m-dialog-note').textContent='Install the Android APK to enable real monitoring.';return;}
    try{
      const minutes=Number($('.m-time-picks .selected')?.dataset.watch||20);
      for(const pkg of appMap[name])await guard.configure({package:pkg,minutes});
      $('#mGuardDialog').close();
      say(`Limit saved (${minutes} min). Enable Accessibility, then open the selected app.`);
      show('profile');
      await refresh();
    }catch(e){$('.m-dialog-note').textContent=e.message;}
  };
  $('#mStartWatch').firstChild.textContent='Save app limit ';

  if(native&&!localStorage.getItem('guardOnboarding')){
    show('profile');
    say('Set up Scroll Guard: tap Connect for Usage Access and Accessibility, then choose an app and save a time limit.');
    localStorage.setItem('guardOnboarding','1');
  }

  // ─── AVATAR WARDROBE STUDIO ───────────────────────────────────────
  let look;
  try{look=JSON.parse(localStorage.getItem('reboundWardrobe')||'{}');}catch{look={};}
  const validLook=value=>({skin:['#edbb92','#b97a50','#70452e'].includes(value?.skin)?value.skin:'#b97a50',hair:['crop','curls','long'].includes(value?.hair)?value.hair:'crop',outfit:['jacket','hoodie','tee'].includes(value?.outfit)?value.outfit:'jacket',pants:['straight','cargo'].includes(value?.pants)?value.pants:'straight',glasses:value?.glasses===true});
  look=validLook(look);
  let draft;

  // Full-body SVG avatar
  const svg=l=>`<svg viewBox="0 0 240 360" role="img" aria-label="Your styled Rebound avatar">
    <!-- Shadow -->
    <ellipse cx="120" cy="345" rx="60" ry="8" fill="#000" opacity=".3"/>
    <!-- Shoes -->
    <ellipse cx="95" cy="335" rx="22" ry="9" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
    <ellipse cx="145" cy="335" rx="22" ry="9" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
    <!-- Trousers -->
    <path d="M88 230 L82 330 L108 330 L120 270 L132 330 L158 330 L152 230 Z"
      fill="${l.pants==='cargo'?'#6b7368':'#1e2420'}" stroke="#111" stroke-width="2"/>
    ${l.pants==='cargo'?'<rect x="85" y="265" width="18" height="14" rx="3" fill="#585e55" stroke="#444" stroke-width="1.5"/><rect x="137" y="265" width="18" height="14" rx="3" fill="#585e55" stroke="#444" stroke-width="1.5"/>':''}
    <!-- Belt -->
    <rect x="86" y="225" width="68" height="9" rx="4" fill="#3a2c1e" stroke="#1a1208" stroke-width="1.5"/>
    <rect x="116" y="226" width="8" height="7" rx="2" fill="#c5a84e" stroke="#9a7f32" stroke-width="1"/>
    <!-- Torso / Outfit -->
    <path d="M78 130 Q60 160 62 220 L178 220 Q180 160 162 130 Q145 120 120 118 Q95 120 78 130 Z"
      fill="${l.outfit==='hoodie'?'#4a8552':l.outfit==='tee'?'#c8d4c0':'#4a5250'}" stroke="#1a1a1a" stroke-width="2"/>
    ${l.outfit==='jacket'?`
      <!-- Jacket lapels -->
      <path d="M120 125 L100 160 L120 168 L140 160 Z" fill="#3c4440" stroke="#1a1a1a" stroke-width="1.5"/>
      <!-- Jacket zipper line -->
      <line x1="120" y1="168" x2="120" y2="218" stroke="#666" stroke-width="3" stroke-dasharray="4,3"/>
      <!-- Jacket pocket -->
      <rect x="90" y="180" width="22" height="16" rx="4" fill="#3c4440" stroke="#5a6360" stroke-width="1.5"/>
    `:l.outfit==='hoodie'?`
      <!-- Hoodie kangaroo pocket -->
      <rect x="96" y="175" width="48" height="26" rx="10" fill="#3a6e44" stroke="#2a5233" stroke-width="1.5"/>
      <!-- Hoodie drawstrings -->
      <line x1="108" y1="132" x2="104" y2="160" stroke="#2a5233" stroke-width="2.5"/>
      <line x1="132" y1="132" x2="136" y2="160" stroke="#2a5233" stroke-width="2.5"/>
    `:`
      <!-- T-shirt Rebound R -->
      <text x="108" y="185" fill="#2a5233" font-size="28" font-weight="900" font-family="Arial,sans-serif">R</text>
    `}
    <!-- Arms -->
    <path d="M78 132 Q48 158 52 200 L72 198 Q72 164 92 146 Z" fill="${l.skin}" stroke="#1a1a1a" stroke-width="2"/>
    <path d="M162 132 Q192 158 188 200 L168 198 Q168 164 148 146 Z" fill="${l.skin}" stroke="#1a1a1a" stroke-width="2"/>
    <!-- Hands -->
    <ellipse cx="58" cy="204" rx="14" ry="10" fill="${l.skin}" stroke="#1a1a1a" stroke-width="2"/>
    <ellipse cx="182" cy="204" rx="14" ry="10" fill="${l.skin}" stroke="#1a1a1a" stroke-width="2"/>
    <!-- Neck -->
    <rect x="109" y="108" width="22" height="24" rx="8" fill="${l.skin}" stroke="#1a1a1a" stroke-width="1.5"/>
    <!-- Head -->
    <ellipse cx="120" cy="76" rx="44" ry="52" fill="${l.skin}" stroke="#1a1a1a" stroke-width="2.5"/>
    <!-- Hair -->
    ${l.hair==='long'?`
      <path d="M76 82 Q55 0 120 14 Q188 0 166 102 L152 94 L154 26 L86 24 L88 96 Z" fill="#1a1810"/>
      <path d="M76 82 Q62 120 68 140 L80 136 Q74 116 80 90Z" fill="#1a1810"/>
      <path d="M166 102 Q178 120 172 140 L160 136 Q166 116 160 90Z" fill="#1a1810"/>
    `:l.hair==='curls'?`
      <path d="M76 62 Q60 20 88 20 Q90 2 112 14 Q120 0 130 14 Q152 4 156 22 Q180 22 168 58 Q158 34 144 40 L120 32 L96 40 Q82 36 76 62Z" fill="#1a1810"/>
    `:`
      <!-- Crop hair -->
      <path d="M76 68 Q60 10 124 16 Q162 14 166 60 Q150 38 86 42 L80 64Z" fill="#1a1810"/>
    `}
    <!-- Ears -->
    <ellipse cx="76" cy="76" rx="8" ry="11" fill="${l.skin}" stroke="#1a1a1a" stroke-width="2"/>
    <ellipse cx="164" cy="76" rx="8" ry="11" fill="${l.skin}" stroke="#1a1a1a" stroke-width="2"/>
    <!-- Ear inner -->
    <ellipse cx="76" cy="76" rx="4" ry="6" fill="#a06848" opacity=".5"/>
    <ellipse cx="164" cy="76" rx="4" ry="6" fill="#a06848" opacity=".5"/>
    <!-- Eyes / Glasses -->
    <g class="wardrobe-eyes">
    ${l.glasses?`
      <rect x="82" y="60" width="30" height="22" rx="7" fill="none" stroke="#8a9e84" stroke-width="3"/>
      <rect x="126" y="60" width="30" height="22" rx="7" fill="none" stroke="#8a9e84" stroke-width="3"/>
      <line x1="112" y1="67" x2="126" y2="67" stroke="#8a9e84" stroke-width="3"/>
      <!-- Lens tint -->
      <rect x="82" y="60" width="30" height="22" rx="7" fill="#aee8ff" opacity=".15"/>
      <rect x="126" y="60" width="30" height="22" rx="7" fill="#aee8ff" opacity=".15"/>
      <!-- Pupils -->
      <circle cx="97" cy="71" r="4" fill="#1a2018"/>
      <circle cx="141" cy="71" r="4" fill="#1a2018"/>
      <circle cx="99" cy="69" r="1.5" fill="white" opacity=".7"/>
      <circle cx="143" cy="69" r="1.5" fill="white" opacity=".7"/>
    `:`
      <circle cx="97" cy="71" r="6" fill="#1a2018"/>
      <circle cx="141" cy="71" r="6" fill="#1a2018"/>
      <circle cx="99" cy="69" r="2" fill="white" opacity=".7"/>
      <circle cx="143" cy="69" r="2" fill="white" opacity=".7"/>
    `}
    </g>
    <!-- Nose -->
    <path d="M116 86 Q120 98 124 86" fill="none" stroke="#7a4e30" stroke-width="2" stroke-linecap="round"/>
    <!-- Mouth / Smile -->
    <path d="M108 103 Q120 116 132 103" fill="none" stroke="#7a4e30" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;

  // Build wardrobe dialog
  const studio=document.createElement('dialog');
  studio.className='wardrobe';
  studio.innerHTML=`
    <form method="dialog"><button class="wardrobe-close" aria-label="Close wardrobe">×</button></form>
    <p class="m-kicker">AVATAR STUDIO</p>
    <h2>Your look. Your Rebound.</h2>
    <div id="wardrobe-preview"></div>
    <div id="wardrobe-options"></div>
    <button id="wardrobe-save" class="m-focus-launch">Save look</button>
    <p role="status" id="wardrobe-status"></p>
  `;
  app.append(studio);

  const choices={
    skin:[['Light','#edbb92'],['Medium','#b97a50'],['Deep','#70452e']],
    hair:[['Crop','crop'],['Curls','curls'],['Long','long']],
    outfit:[['Varsity Jacket','jacket'],['Hoodie','hoodie'],['T-shirt','tee']],
    pants:[['Straight','straight'],['Cargo','cargo']],
    glasses:[['Glasses',true],['No glasses',false]]
  };

  function draw(){
    studio.querySelector('#wardrobe-preview').innerHTML=svg(draft);
    const options=studio.querySelector('#wardrobe-options');
    options.replaceChildren();
    for(const [key,items]of Object.entries(choices)){
      const field=document.createElement('fieldset');
      const legend=document.createElement('legend');
      legend.textContent=key;
      field.append(legend);
      for(const [name,value]of items){
        const b=document.createElement('button');
        b.type='button';
        b.textContent=name;
        b.setAttribute('aria-pressed',String(JSON.stringify(draft[key])===JSON.stringify(value)));
        b.onclick=()=>{draft[key]=value;draw();};
        field.append(b);
      }
      options.append(field);
    }
  }

  // Mini avatar render in the account screen
  const render=()=>{
    const full=$('.m-avatar-full, .wardrobe-mini');
    if(full){full.className='wardrobe-mini';full.innerHTML=svg(look);}
    const photo=localStorage.getItem('reboundProfilePhoto');
    app.querySelectorAll('.m-avatar-face').forEach(face=>{face.style.backgroundImage=photo?`url(${photo})`:'';face.innerHTML=photo?'':svg(look);});
    document.querySelectorAll('[data-location-avatar]').forEach(face=>{face.innerHTML=svg(look);});
  };
  render();
  window.addEventListener('rebound:avatar-refresh',()=>{try{look=validLook(JSON.parse(localStorage.getItem('reboundWardrobe')||'{}'));}catch{}render();});
  $('#m-save-profile').addEventListener('click',render);

  // Open studio button (override whatever mobile-shell set)
  $('#m-open-studio').onclick=()=>{draft={...look};draw();studio.showModal();};

  // Save look
  studio.querySelector('#wardrobe-save').onclick=()=>{
    try{
      localStorage.setItem('reboundWardrobe',JSON.stringify(draft));
      look={...draft};
      render();
      studio.close();
      studio.querySelector('#wardrobe-status').textContent='';
    }catch{
      studio.querySelector('#wardrobe-status').textContent='Storage full. Look could not be saved.';
    }
  };

  // ─── TOWN SCREEN FIX ───────────────────────────────────────────────
  // Replace misleading server counts with honest local state
  const town=$('[data-screen="town"]');
  if(town){
    // Fix hero copy
    const heroSpan=town.querySelector('.m-town-hero span');
    const heroSmall=town.querySelector('.m-town-hero small');
    if(heroSpan) heroSpan.textContent='LOCAL STUDY SPACE';
    if(heroSmall) heroSmall.textContent='Local room · online rooms require a server connection';

    // Fix server entries — show real status
    town.querySelectorAll('.m-server small').forEach(x=>x.textContent='Preview room · not connected to a server');
    town.querySelectorAll('.m-server button').forEach(b=>{
      if(b.textContent==='Joined'){
        b.textContent='Leave';
        b.onclick=()=>{b.textContent='Join';};
      } else {
        b.textContent='Join locally';
        b.onclick=()=>{
          const title=b.parentElement.querySelector('b')?.textContent||'Study Room';
          $('#m-room-title').textContent=title;
          $('#m-room-status').textContent='Local room ready · invite friends to begin';
          b.textContent='Joined';
          show('town');
        };
      }
    });

    // Join Library — works locally
    $('#m-join-library').onclick=()=>{
      $('#m-room-title').textContent='Library Hall';
      $('#m-room-status').textContent='Local library room · focus session ready';
      $('#m-join-library').textContent='✓ Joined';
    };

    // Save / Create server
    $('#m-town-save').onclick=()=>{
      const name=$('#m-town-name').value.trim();
      if(!name)return;
      $('#m-room-title').textContent=name;
      $('#m-room-status').textContent='Local room saved · no invitation sent yet';
      localStorage.setItem('reboundRoom',name);
    };
  }

  // ─── NOTES SHARING ────────────────────────────────────────────────
  const shareAny=async text=>{
    if(guard)return guard.share({text});
    if(navigator.share)return navigator.share({title:'Rebound notes',text});
    await navigator.clipboard?.writeText(text);
  };

  // "Share notes" action button → go to town → switch to chat tab
  $('#m-open-notes').onclick=()=>{
    show('town');
    // Click the chat tab
    const chatTab=app.querySelector('[data-town-panel="chat"]');
    if(chatTab) chatTab.click();
  };

  // Copy invite button with native share
  $('#m-copy-invite').onclick=async()=>{
    const roomName=$('#m-room-title')?.textContent||'Focus Sprint';
    const invite=`Join my Rebound study room "${roomName}"! Let's focus together.`;
    try{
      await shareAny(invite);
      $('#m-copy-invite').textContent='Shared ✓';
    }catch{
      $('#m-copy-invite').textContent='Invite ready';
    }
  };

  // Chat: send a local message
  const sendBtn=$('#m-send-chat');
  if(sendBtn){
    sendBtn.onclick=()=>{
      const input=$('#m-chat-text');
      const message=input?.value.trim();
      if(!message)return;
      const line=document.createElement('p');
      line.className='m-chat-message';
      const time=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      line.innerHTML=`<b>You</b> <small>${time}</small><span>${message}</span>`;
      $('#m-chat-feed')?.append(line);
      if(input) input.value='';
    };
    // Enter key also sends
    const chatInput=$('#m-chat-text');
    if(chatInput) chatInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendBtn.click();}});
  }

  // Note text sharing
  const noteArea=document.createElement('textarea');
  noteArea.placeholder='Write study notes to share with your room';
  noteArea.rows=4;
  noteArea.maxLength=10000;
  noteArea.style.cssText='width:100%;box-sizing:border-box;margin-top:10px;border:1px solid #71816f66;border-radius:10px;background:#101310;color:white;padding:10px;font:inherit;resize:vertical;min-height:70px;';
  const shareNotesBtn=document.createElement('button');
  shareNotesBtn.textContent='Share notes ↗';
  shareNotesBtn.className='m-focus-launch';
  shareNotesBtn.style.marginTop='8px';
  shareNotesBtn.onclick=async()=>{
    try{
      await shareAny(noteArea.value||'My Rebound study notes');
    }catch(e){
      const status=$('#m-call-status');
      if(status) status.textContent='Sharing not available. Try copying the text.';
    }
  };
  const chat=$('.m-chat');
  if(chat){chat.append(noteArea,shareNotesBtn);}

  // Note image sharing
  $('#m-note-image').onchange=async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title:'Rebound notes'});}catch{}
    } else {
      const status=$('#m-call-status');
      if(status) status.textContent='File sharing not supported here. Use text notes instead.';
    }
  };

  // Location sharing
  $('#m-share-location').onclick=()=>{
    const status=$('#m-location-status');
    if(!navigator.geolocation){if(status)status.textContent='Location not available.';return;}
    if(status) status.textContent='Requesting location…';
    navigator.geolocation.getCurrentPosition(pos=>{
      if(status) status.textContent='Location ready. Tap again to share.';
      $('#m-share-location').onclick=async()=>{
        try{
          await shareAny(`My study location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`);
          if(status) status.textContent='Location shared. Not stored by Rebound.';
        }catch{if(status)status.textContent='Location was not shared.';}
      };
    },()=>{if(status)status.textContent='Location permission denied.';},{timeout:10000});
  };
}
