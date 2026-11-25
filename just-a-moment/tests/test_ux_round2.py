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
        await J("""(()=>{ const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); return r; };
          mk('gp',0,0,3,2); mk('pharmacy',6,0,8,2); mk('physio',11,0,13,2); placeObject({key:'reception',x:7,y:7,o:0,room:0});
          ['receptionist','doctor','pharmacist','nurse'].forEach(r=>hire(r,0)); })()""")
        # move the physio room
        r = await J("""(()=>{ const r=S.rooms[2]; const ox=r.x; startMoveRoom(r); const c=moveRoomCheck(r,16,0); finishMoveRoom(16,0); return ox+' -> '+r.x+' door '+JSON.stringify(r.door)+' objs '+roomObjs(r).map(o=>o.x).join(','); })()""")
        print('move', r)
        print('bad move', await J("(()=>{ const r=S.rooms[2]; startMoveRoom(r); const c=moveRoomCheck(r,0,0); cancelTool(); return c.err; })()"))
        await J("__jam.run(100)"); await pg.click('#bOpen')
        await J("for(let i=0;i<12;i++) spawnPatient(); __jam.run(600)")
        await J("openRoomCard(S.rooms[0])"); await pg.wait_for_timeout(200); await pg.screenshot(path='ux2_roomcard.png')
        print('card has queue', await J("document.getElementById('sheet').textContent.includes('Queue') || document.getElementById('sheet').textContent.includes('Nobody waiting')"))
        await J("closeSheet(); S.labels=true; __jam.cam.z=1.6; centerOn({x:6,y:5})"); await pg.wait_for_timeout(300); await pg.screenshot(path='ux2_bars.png')
        await J("sandboxDo('vip:auntie')"); await pg.wait_for_timeout(200)
        print('vip toast', await J("document.getElementById('toast').textContent"))
        await J("sandboxDo('end'); __jam.run(900)"); await pg.wait_for_timeout(300)
        print('graph', await J("!!document.querySelector('.dgraph')"))
        await pg.screenshot(path='ux2_report.png')
        await J("document.getElementById('bNext').click()"); await pg.wait_for_timeout(200)
        await J("openHelp('how')"); await pg.wait_for_timeout(200); await pg.screenshot(path='ux2_help.png')
        print('errors', errs); await b.close()
asyncio.run(main())
