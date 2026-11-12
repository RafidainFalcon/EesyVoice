(()=>{'use strict';const $=id=>document.getElementById(id);
$('profileLogout')?.addEventListener('click',()=>$('logout')?.click());
$('securityRefresh')?.addEventListener('click',async()=>{
 const b=$('securityRefresh');b.disabled=true;try{
 const user=window.eesyAuth?.currentUser;if(!user)throw Error('سجّل الدخول أولاً');
 const r=await fetch('/api/security-center',{headers:{Authorization:'Bearer '+await user.getIdToken()}});
 const d=await r.json();if(!r.ok)throw Error(d.error||'تعذر التحميل');
 $('securitySummary').textContent=`آخر ${d.stats.events} حدث أمني • ${d.stats.processing} توليد قيد التنفيذ • ${d.stats.failed} توليد فاشل (ضمن آخر 60 عملية)`;
 const host=$('securityEvents');host.replaceChildren();
 for(const item of d.events){const div=document.createElement('div');div.className='result-card';div.textContent=[item.event,item.uid.slice(0,14),item.createdAt||''].join(' • ');host.append(div)}
 if(!d.events.length)host.textContent='ماكو أحداث أمنية مسجلة بعد';
 }catch(e){$('securitySummary').textContent=e.message}finally{b.disabled=false}
});
})();
