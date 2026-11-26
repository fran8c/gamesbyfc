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
        print(await J("""(()=>{ const out=[];
          T.mode='room'; T.roomType='gp'; T.drag={x0:1,y0:0,x1:5,y1:3}; finishRoomDrag(); const r=S.rooms[0]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); T.roomId=r.id;
          placeObject({key:'gp-desk',x:2,y:1,o:0,room:r.id}); const o=S.objs[0];
          const s=tileOfPt(spotOf(o,'s')), p=tileOfPt(spotOf(o,'p'));
          out.push('on staff spot: '+checkPlace({key:'plant',x:s.x,y:s.y,o:0,room:r.id}));
          out.push('on patient spot: '+checkPlace({key:'plant',x:p.x,y:p.y,o:0,room:r.id}));
          out.push('elsewhere: '+checkPlace({key:'plant',x:5,y:3,o:0,room:r.id}));
          placeObject({key:'reception',x:9,y:7,o:0,room:0}); const rc=S.objs.find(q=>q.key==='reception'); const rs=tileOfPt(spotOf(rc,'s'));
          out.push('behind reception: '+checkPlace({key:'plant',x:rs.x,y:rs.y,o:0,room:0}));
          placeObject({key:'bench',x:3,y:8,o:0,room:0}); const bn=S.objs.find(q=>q.key==='bench'); const bf=seatsOf(bn)[0].front;
          out.push('in front of bench: '+checkPlace({key:'plant',x:bf.x,y:bf.y,o:0,room:0}));
          startPlace('plant'); T.roomId=r.id; window.__h=setInterval(()=>{T.hover={x:s.x,y:s.y};},16);
          return out.join('\\n'); })()"""))
        await J("__jam.cam.z=2.4; centerOn({x:3,y:1.5})"); await pg.wait_for_timeout(400); await pg.screenshot(path='spots_protected.png')
        print('errors', errs); await b.close()
asyncio.run(main())
