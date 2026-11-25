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
        print(await J("""(()=>{ T.mode='room'; T.roomType='gp'; T.drag={x0:1,y0:0,x1:6,y1:3}; finishRoomDrag(); const r=S.rooms[0]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); T.roomId=r.id;
          const a=placeObject({key:'gp-desk',x:1,y:1,o:0,room:r.id}), b2=placeObject({key:'gp-desk',x:4,y:1,o:0,room:r.id}); finishFurnish();
          T.mode='room'; T.roomType='pharmacy'; T.drag={x0:9,y0:0,x1:11,y1:2}; finishRoomDrag(); const ph=S.rooms[1]; const d2=doorOptions(ph); placeDoor(d2.find(q=>q.oy>q.y)||d2[0]); autoFurnish(ph); T.roomId=ph.id; finishFurnish();
          placeObject({key:'reception',x:7,y:7,o:0,room:0}); placeObject({key:'reception',x:12,y:7,o:0,room:0});
          ['receptionist','receptionist','doctor','doctor','pharmacist'].forEach(r=>hire(r,0));
          return 'desks '+a+' '+b2+' blocked '+r.blocked; })()"""))
        await J("__jam.run(150)"); await pg.click('#bOpen')
        await J("for(let i=0;i<20;i++) spawnPatient(); window.__max=0")
        for i in range(30): await J("__jam.run(30); __max=Math.max(__max, S.rooms[0].serving.length)")
        print('max seen at once in GP', await J("__max"), 'capacity', await J("capacity(S.rooms[0])"), 'cures', await J("S.cures"))
        spots = await J("JSON.stringify(S.staff.filter(s=>s.role==='doctor').map(s=>staffSpotOf(s)))"); print('doctor spots', spots)
        await J("__jam.cam.z=2; centerOn({x:3.5,y:2})"); await pg.wait_for_timeout(300); await pg.screenshot(path='two_desks.png')
        print('errors', errs); await b.close()
asyncio.run(main())
