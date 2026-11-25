import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = 'file://' + os.path.join(HERE, '..', 'index.html')
CHROME = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True); os.chdir(os.path.join(HERE, 'shots'))
from playwright.async_api import async_playwright
# Level 3: lay out a full hospital through the game's own build functions
SETUP = r"""(()=>{
  const out=[]; S.cash = 60000;
  const ei = entranceIn();
  out.push('desk '+placeObject({key:'reception', x:ei.x-1, y:ei.y-3, o:0, room:0}));
  out.push('ticket '+placeObject({key:'ticket', x:ei.x+2, y:ei.y-1, o:0, room:0}));
  const plan = [['gp',0,0,3,3],['pharmacy',4,0,3,3],['ward',8,0,4,3],['diagnosis',13,0,3,3],['treatment',17,0,3,3],['records',21,0,3,3],
                ['neurology',13,5,3,3],['physio',17,5,3,3],['surgery',20,9,4,3],['emergency',13,10,3,3],['staff',0,6,3,3]];
  const items = {gp:['gp-desk'], pharmacy:['counter'], ward:['ward-bed','ward-bed'], diagnosis:['scanner','console'], treatment:['treat-bed'], records:['stamp-desk','copier'],
                 neurology:['neuro-chair','console'], physio:['physio'], surgery:['op-table','monitor'], emergency:['trolley','crash-cart'], staff:['kopi']};
  for (const [t,x,y,w,h] of plan){
    T.mode='room'; T.roomType=t; T.drag={x0:x,y0:y,x1:x+w-1,y1:y+h-1}; finishRoomDrag();
    const r = S.rooms[S.rooms.length-1]; if (!r || r.type!==t){ out.push('FAILED room '+t); continue; }
    const d = doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d.find(q=>q.oy<q.y)||d[0]);
    // try every tile and both turns until each item fits
    for (const k of items[t]){ let ok=false;
      for (let o of [0,1]) for (let yy=r.y; yy<r.y+r.h && !ok; yy++) for (let xx=r.x; xx<r.x+r.w && !ok; xx++){ const gh={key:k,x:xx,y:yy,o,room:r.id}; if(!checkPlace(gh)){ T.mode='place'; T.roomId=r.id; ok=placeObject(gh);} }
      if(!ok) out.push('no fit '+k+' in '+t); }
    T.roomId=r.id; finishFurnish(); out.push(t+':'+r.state);
  }
  // benches near doors
  let nb=0; for (const r of S.rooms) if (r.door){ const d=r.door; for (const [dx,dy,o] of [[1,0,2],[-2,0,2],[1,1,0],[-2,1,0],[0,1,1]]){ const gh={key:'bench',x:d.ox+dx,y:d.oy+dy,o,room:0}; if(!checkPlace(gh)){ placeObject(gh); nb++; break; } } }
  out.push('benches '+nb);
  for (const [x,y] of [[6,4],[11,8],[3,10]]) placeObject({key:'vending',x,y,o:0,room:0});
  for (const r of ['receptionist','receptionist','doctor','doctor','doctor','doctor','doctor','nurse','nurse','nurse','nurse','pharmacist','handyman','handyman']) hire(r,0);
  out.push('unassigned '+S.staff.filter(s=>!s.assigned && s.role!=='handyman').map(s=>s.role).join(','));
  S.tut = null; drawAdvisor();
  return out;
})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**CHROME, args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1280,'height':720}, device_scale_factor=2)
        await pg.add_init_script("setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)");
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(800)
        await J("localStorage.setItem('just-a-moment-v2-progress', JSON.stringify({unlocked:3}))"); await pg.reload(); await pg.wait_for_timeout(600)
        await pg.click('[data-lv="2"]'); await pg.wait_for_timeout(300)
        for line in await J(SETUP): print(' ', line)
        await J("__jam.run(200)")
        await pg.screenshot(path='v3_prep.png')
        await J("window.WO=[]; const _w=walkOut; walkOut=function(pt){ const p=getPoint(pt.at); WO.push((p?pointType(p):'none')+'|'+pt.st+'|q'+(p?p.queue.length:0)+'|age'+Math.round(S.time-pt.born)); return _w(pt); }; 0")
        for day in range(4):
            await J("S.day = Math.max(S.day, 2)")
            await J("if (S.phase==='prep') openDoors()")
            if day == 1: await J("S.emergencyPlan={at:20}; S.chaosPlan={type:'powerCut', at:60}; S.vipPlan={type:'nephew', at:15, done:false}")
            if day == 2: await J("S.objs.filter(o=>OBJ[o.key].machine).forEach(o=>o.wear=95); S.chaosPlan={type:'wardCat', at:30}; S.event={type:'monsoonDay'}")
            shot = False
            for i in range(40):
                await J("if(S.dilemmaOpen) chooseDilemma('a'); __jam.run(100)")
                if day == 1 and not shot and await J("S.time>70"):
                    await pg.screenshot(path='v3_open.png'); shot = True
                if await J("S.phase!=='open'"): break
            if day == 3: print('WO', await J("WO.splice(0)")); print('staff', await J("S.staff.map(s=>s.role[0]+':'+s.mode+':'+Math.round(s.mood)+(s.assigned||'')+(s.napping?'Z':'')).join(' ')")); print('objs', await J("S.objs.filter(o=>o.jam||o.broken||o.empty).map(o=>o.key+(o.jam?' jam':'')+(o.broken?' broken':'')+(o.empty?' empty':''))"), 'stamps', await J("S.stamps"), 'flood', await J("JSON.stringify(S.flood)"), 'freeze', await J("S.freezeUntil"), 'blocks', await J("JSON.stringify(S.blocks)"))
            else: await J("WO.splice(0)")
            print('  events:', await J("S.log.filter(l=>/mergency|broken|Fixed|cat|pigeon|power|flood|mop|Budi|nephew|Queue-Jumper/i.test(l.text)).slice(0,5).map(l=>l.text.slice(0,70))"))
            info = await J("({phase:S.phase, cures:S.cures, walk:S.walkouts, total:S.totalCures, cash:S.cash, rating:levelRating().toFixed(2), broken:S.objs.filter(o=>o.broken).length, litter:S.litter.length, log:S.log.slice(0,4).map(l=>l.text.slice(0,60))})")
            print('day', day, info)
            if await J("S.phase==='report'"):
                await J("document.getElementById('bNext').click()")
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
