import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = 'file://' + os.path.join(HERE, '..', 'index.html')
CHROME = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True); os.chdir(os.path.join(HERE, 'shots'))
from playwright.async_api import async_playwright
HIDE = "setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**CHROME, args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1280,'height':720}, device_scale_factor=1.5)
        await pg.add_init_script(HIDE); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(1500)
        await J("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(1200)
        await pg.click('#bSandbox'); await pg.wait_for_timeout(300)
        await J("""(()=>{ const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); };
          mk('gp',0,0,3,2); mk('pharmacy',6,0,8,2); mk('records',18,0,21,3); mk('toilet',18,8,21,10); placeObject({key:'reception',x:7,y:7,o:0,room:0}); placeObject({key:'kopi',x:12,y:5,o:0,room:0});
          ['receptionist','doctor','pharmacist'].forEach(r=>hire(r,0)); __jam.run(100); })()""")
        await pg.click('#bOpen')
        await J("for(let i=0;i<10;i++) spawnPatient(); __jam.run(200); sandboxDo('fire'); sandboxDo('nosup'); sandboxDo('dirty'); __jam.run(20)")
        await J("__jam.cam.z=1.5; centerOn({x:5,y:4})"); await pg.wait_for_timeout(500)
        await pg.screenshot(path='problems_markers.png')
        print('alert text', await J("document.getElementById('alertBtn').textContent"))
        print('edge arrows', await J("(window.__edgeHits||[]).length"))
        await J("document.getElementById('alertBtn').click()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='problems_list.png')
        n = await J("document.querySelectorAll('[data-goto]').length"); print('list rows with 📍', n)
        await J("document.querySelector('[data-goto]').click()"); await pg.wait_for_timeout(200)
        print('errors', errs); await b.close()
asyncio.run(main())
