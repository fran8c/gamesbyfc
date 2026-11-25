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
        await pg.click('#bSandbox'); await pg.wait_for_timeout(400)
        print(await J("""(()=>{ const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); return r.state; };
          const a=[mk('gp',0,0,3,2), mk('gp',5,0,8,2), mk('pharmacy',10,0,12,2), mk('toilet',15,0,19,2)];
          // extra sinks and cubicles
          const tr=S.rooms[3]; T.roomId=tr.id; a.push(placeObject({key:'sink',x:18,y:1,o:0,room:tr.id}), placeObject({key:'toilet',x:16,y:0,o:0,room:tr.id}));
          placeObject({key:'reception',x:7,y:7,o:0,room:0}); placeObject({key:'bench',x:4,y:6,o:0,room:0});
          ['receptionist','doctor','doctor','pharmacist','handyman'].forEach(r=>hire(r,0));
          const before=S.bw+'x'+S.bh; openBuild(); expandBuilding('side'); expandBuilding('back');
          return a.join(' ')+' '+before+' -> '+S.bw+'x'+S.bh+' layoutOk='+layoutOk(); })()"""))
        await J("closeSheet(); __jam.run(100)"); await pg.click('#bOpen')
        await J("for(let i=0;i<20;i++) spawnPatient(); S.patients.forEach(p=>p.looAt=S.time+30); __jam.run(500)")
        print(await J("JSON.stringify({sinks:[...new Set(S.patients.filter(p=>p.sinkObj).map(p=>p.sinkObj))].length, cures:S.cures, gp:S.rooms.filter(r=>r.type==='gp').map(r=>r.queue.length)})"))
        await J("__jam.cam.z=1.0; fitCamera()"); await pg.wait_for_timeout(300); await pg.screenshot(path='w32.png')
        await J("__jam.cam.z=2.2; centerOn({x:S.ent+1,y:S.bh-1})"); await pg.wait_for_timeout(300); await pg.screenshot(path='w32_ent.png')
        print('errors', errs[:5]); await b.close()
asyncio.run(main())
