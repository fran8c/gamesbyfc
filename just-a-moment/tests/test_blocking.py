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
        # a small GP office; furnish it, then try to place a plant on the doctor's spot
        print(await J("""(()=>{ T.mode='room'; T.roomType='gp'; T.drag={x0:2,y0:0,x1:4,y1:2}; finishRoomDrag(); const r=S.rooms[0]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); T.roomId=r.id;
          // where would the desk's staff stand? put a plant there first
          const sp=tileOfPt(spotOf({key:'gp-desk',x:2,y:1,o:0},'s')); const pl=placeObject({key:'plant',x:sp.x,y:sp.y,o:0,room:r.id});
          startPlace('gp-desk'); T.roomId=r.id; T.o=0; window.__hold=setInterval(()=>{ T.hover={x:2,y:1}; T.o=0; },16);
          return 'plant '+pl+' at '+JSON.stringify(sp); })()"""))
        await J("__jam.cam.z=2.4; centerOn({x:3,y:1.5})"); await pg.wait_for_timeout(400)
        print('msg', await J("placeMessage(T.ghost, T.ghostErr)"))
        print('spots', await J("JSON.stringify(spotStatus(T.ghost).map(s=>s.kind+':'+s.why))"))
        await pg.screenshot(path='block_place.png')
        await J("clearInterval(__hold); cancelTool(); S.objs=S.objs.filter(o=>o.key!=='plant'); rebuildGrid(); placeObject({key:'gp-desk',x:2,y:1,o:0,room:S.rooms[0].id})")
        # force a blocked room: put a plant on the patient spot by hand, then finish
        print(await J("""(()=>{ const r=S.rooms[0], o=S.objs.find(q=>q.key==='gp-desk'); const pp=tileOfPt(spotOf(o,'p'));
          cancelTool(); S.objs.push({id:nextId(), key:'plant', x:pp.x, y:pp.y, o:0, room:r.id, queue:[], serving:[]}); rebuildGrid();
          T.roomId=r.id; finishFurnish(); return 'blocked: '+r.blocked; })()"""))
        # stuck patient: open, spawn, check problems list
        await J("""(()=>{ const rc=[[9,7],[12,7],[9,10],[14,10]].find(([x,y])=>placeObject({key:'reception',x,y,o:0,room:0}));
          const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); return r; };
          window.__err=[['pharmacy',7,0,9,2]].map(a=>checkRoomRect(a[0],rectOf({x0:a[1],y0:a[2],x1:a[3],y1:a[4]}))); window.__auto=[mk('pharmacy',7,0,9,2), mk('toilet',12,0,14,2), mk('ward',16,0,19,3), mk('records',20,0,23,3), mk('treatment',0,5,3,7)].map(r=>r.type+':'+(r.blocked||'ok')); ['receptionist','doctor'].forEach(r=>hire(r,0)); __jam.run(100) })()""")
        await pg.click('#bOpen'); await J("for(let i=0;i<4;i++) spawnPatient(); __jam.run(400)")
        print('auto-furnished', await J("JSON.stringify(__auto)"), await J("JSON.stringify(__err)"), await J("S.rooms.length"))
        print('phase', await J("S.phase"), await J("canOpen()"))
        print('problems', await J("JSON.stringify(problems().filter(p=>p.icon==='⚠️'||p.icon==='🚧').map(p=>p.text).slice(0,3))"))
        print('stuck test', await J("(()=>{ const pt=S.patients[0]; walkPath(pt,{x:-5,y:-5}); S.time+=5; return stuckList().length+' '+problems().some(p=>p.icon==='🚧'); })()"))
        await J("__jam.cam.z=1.8; centerOn({x:4,y:3})"); await pg.wait_for_timeout(300); await pg.screenshot(path='block_play.png')
        print('errors', errs); await b.close()
asyncio.run(main())
