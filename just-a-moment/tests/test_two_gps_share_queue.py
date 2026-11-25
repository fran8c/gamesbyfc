import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = 'file://' + os.path.join(HERE, '..', 'index.html')
CHROME = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True); os.chdir(os.path.join(HERE, 'shots'))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**CHROME, args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1280,'height':720}, device_scale_factor=1.5)
        await pg.add_init_script("setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)");
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(700)
        await J("localStorage.clear(); localStorage.setItem('just-a-moment-v2-progress', JSON.stringify({unlocked:3}))"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('[data-lv="0"]'); await pg.wait_for_timeout(300)
        print(await J("""(()=>{ S.tut=null; drawAdvisor(); S.cash=90000;
          const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); return r.state; };
          const a=[mk('gp',0,0,3,2), mk('gp',5,0,8,2), mk('pharmacy',10,0,12,2)];
          placeObject({key:'reception',x:6,y:7,o:0,room:0}); placeObject({key:'reception',x:2,y:7,o:0,room:0});
          // benches right outside the GP doors
          placeObject({key:'bench',x:1,y:4,o:0,room:0}); placeObject({key:'bench',x:6,y:4,o:0,room:0});
          ['receptionist','receptionist','doctor','doctor','pharmacist'].forEach(r=>hire(r,0)); return a.join(' '); })()"""))
        await J("__jam.run(150)"); await pg.click('#bOpen')
        await J("for(let i=0;i<22;i++) spawnPatient()")
        log=[]
        for i in range(12):
            r = await J("""(()=>{ __jam.run(150); const gps=S.rooms.filter(r=>r.type==='gp'); 
              const stuck=S.patients.filter(p=>{ const k=p.id; window.__lp=window.__lp||{}; const prev=__lp[k]; __lp[k]={x:p.pos.x,y:p.pos.y,st:p.st,t:S.time}; return prev && prev.st===p.st && p.st==='go' && Math.hypot(prev.x-p.pos.x,prev.y-p.pos.y)<0.01; }).length;
              return gps.map(r=>r.queue.length+'+'+r.serving.length).join(' | ')+'  stuckGo='+stuck+' cures='+S.cures+' out='+S.walkouts; })()""")
            log.append(r)
            if i==5:
                await J("__jam.cam.z=1.7; centerOn({x:5,y:5})"); await pg.wait_for_timeout(300); await pg.screenshot(path='w31.png')
        print('\n'.join(log))
        print(await J("JSON.stringify(S.log.slice(-30).filter(l=>/left|walk/i.test(l.text)).map(l=>l.text).slice(0,6))")); print('errors', errs[:5]); await b.close()
asyncio.run(main())
