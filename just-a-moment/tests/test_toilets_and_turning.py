import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = 'file://' + os.path.join(HERE, '..', 'index.html')
CHROME = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True); os.chdir(os.path.join(HERE, 'shots'))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**CHROME, args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1280,'height':720}, device_scale_factor=2)
        await pg.add_init_script("setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)");
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(700)
        await J("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('[data-lv="0"]'); await pg.wait_for_timeout(300)
        print(await J("""(()=>{ S.tut=null; drawAdvisor(); S.cash=9000; const out=[];
          placeObject({key:'reception',x:2,y:7,o:0,room:0});
          const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); out.push(t+':'+r.state); return r; };
          mk('gp',0,0,3,2); mk('pharmacy',5,0,7,2); const t=mk('toilet',9,0,11,1);
          T.roomId=t.id; T.mode='place'; out.push('2nd cubicle '+!!(findSpot('toilet',t) && placeObject(findSpot('toilet',t)))); T.mode=null;
          placeObject({key:'bench',x:1,y:4,o:0,room:0}); placeObject({key:'bench',x:5,y:4,o:0,room:0});
          ['receptionist','doctor','pharmacist','handyman'].forEach(r=>hire(r,0));
          return out; })()"""))
        # four turns of the GP desk
        print('gp desk turns', await J("(()=>{ const o=S.objs.find(q=>q.key==='gp-desk'); const r=[]; for(let i=0;i<4;i++){ rotateObject(o); r.push(o.o);} return r; })()"))
        await J("__jam.run(150)")
        await pg.click('#bOpen')
        loo = 0
        for i in range(30):
            await J("if(S.dilemmaOpen) chooseDilemma('b'); __jam.run(100)")
            loo = max(loo, await J("S.patients.filter(p=>p.st==='loo').length"))
            if i == 14:
                await J("__jam.cam.z=1.9; centerOn({x:5,y:2})"); await pg.wait_for_timeout(250); await pg.screenshot(path='v2_loo.png')
            if await J("S.phase!=='open'"): break
        print('max at loo', loo, 'phase', await J("S.phase"), 'cures', await J("S.cures"), 'walk', await J("S.walkouts"), 'dirt', await J("S.objs.filter(o=>o.key==='toilet').map(o=>Math.round(o.dirt||0))"))
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
