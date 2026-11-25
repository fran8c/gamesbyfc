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
        await pg.add_init_script("setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)"); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(700)
        await J("localStorage.clear(); localStorage.setItem('just-a-moment-v2-progress', JSON.stringify({unlocked:3}))"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('[data-lv="1"]'); await pg.wait_for_timeout(300)
        await J("""(()=>{ S.tut=null; drawAdvisor(); S.cash=30000;
          placeObject({key:'reception',x:3,y:9,o:0,room:0});
          const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); return r; };
          mk('gp',0,0,3,2); mk('pharmacy',4,0,6,2); const w=mk('ward',7,0,11,3); T.roomId=w.id; T.mode='place'; const s2=findSpot('ward-bed',w); if(s2) placeObject(s2); T.mode=null;
          mk('diagnosis',12,0,14,2); mk('treatment',15,0,17,2);
          for (const [x,y] of [[1,4],[5,4],[9,5],[13,4],[16,4]]) placeObject({key:'bench',x,y,o:0,room:0});
          ['receptionist','doctor','pharmacist','nurse','nurse','nurse','handyman'].forEach(r=>hire(r,0)); S.day=3; })()""")
        await J("__jam.run(200)")
        await pg.click('#bOpen')
        for i in range(16): await J("if(S.dilemmaOpen) chooseDilemma('b'); __jam.run(100)")
        await J("__jam.cam.z=1.7; centerOn({x:11,y:3})"); await pg.wait_for_timeout(300); await pg.screenshot(path='v2_lying.png')
        print('serving on beds', await J("S.patients.filter(p=>p.st==='serve'&&p.svcObj&&LIE_ON.includes(objById(p.svcObj).key)).length"), 'seated', await J("S.patients.filter(p=>seatedNow(p)).length"))
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
