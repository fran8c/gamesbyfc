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
        await J("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.screenshot(path='w25_title.png')
        await pg.click('#bSandbox'); await pg.wait_for_timeout(400)
        r = await J("""(()=>{ const out=[];
          const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); out.push(t+':'+r.state); return r; };
          placeObject({key:'reception',x:10,y:9,o:0,room:0});
          mk('gp',0,0,3,3); mk('pharmacy',5,0,8,3); mk('diagnosis',10,0,13,3); mk('treatment',15,0,18,3); mk('toilet',20,0,23,2); mk('staff',0,5,3,8); mk('records',20,4,23,7); mk('ward',15,5,18,8);
          placeObject({key:'bench',x:6,y:7,o:0,room:0}); placeObject({key:'vending',x:13,y:6,o:0,room:0}); placeObject({key:'cooler',x:12,y:6,o:0,room:0});
          ['receptionist','doctor','pharmacist','nurse','nurse','nurse','receptionist','handyman'].forEach(r=>hire(r,0));
          return out.join(' '); })()""")
        print(r)
        await J("__jam.run(100)")
        await pg.click('#bOpen'); await pg.wait_for_timeout(200)
        await J("sandboxDo('crowd'); sandboxDo('crowd'); __jam.run(400); sandboxDo('stress'); sandboxDo('dirty'); sandboxDo('fire'); sandboxDo('nosup'); __jam.run(30)")
        await J("__jam.cam.z=1.3; centerOn({x:11,y:6})"); await pg.wait_for_timeout(500)
        await pg.screenshot(path='w25_play.png')
        print(await J("JSON.stringify(problems().map(p=>p.icon+' '+p.text))"))
        await pg.click('#tSandbox'); await pg.wait_for_timeout(300); await pg.screenshot(path='w25_panel.png')
        await J("closeSheet(); sandboxDo('end'); __jam.run(900)")
        await pg.wait_for_timeout(300)
        print('phase', await J("S.phase"))
        await J("if(S.phase==='report') document.getElementById('bNext').click()"); await pg.wait_for_timeout(300)
        await J("sandboxDo('paper')"); await pg.wait_for_timeout(300); await pg.screenshot(path='w25_paper.png')
        print('errors', errs[:5]); await b.close()
asyncio.run(main())
