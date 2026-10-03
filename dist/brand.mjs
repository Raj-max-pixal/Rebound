const logoPath='rebound-logo.png';
const icon=document.createElement('link');
icon.rel='icon';
icon.type='image/png';
icon.href=logoPath;
document.head.append(icon);
const style=document.createElement('style');
style.textContent='.brand-logo{width:40px;height:40px;object-fit:contain;flex:none}@media(max-width:700px){.brand-logo{width:34px;height:34px}}';
document.head.append(style);
document.querySelectorAll('.brand').forEach(brand=>{
  const mark=brand.querySelector('.brandmark');
  if(!mark)return;
  const logo=document.createElement('img');
  logo.className='brand-logo';
  logo.src=logoPath;
  logo.alt='';
  mark.replaceWith(logo);
});
