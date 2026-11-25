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
        await pg.click('[data-lv="0"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='ux_checklist.png')
        print('checklist', await J("document.getElementById('goalCard').textContent.includes('Getting started')"))
        # grouped buttons and tabs
        await pg.click('#gBuild'); await pg.wait_for_timeout(150)
        print('build tabs', await J("document.querySelectorAll('[data-gtab]').length"))
        await pg.click('[data-gtab="tFurn"]'); await pg.wait_for_timeout(150)
        await pg.click('#gStaff'); await pg.wait_for_timeout(150); await pg.click('[data-gtab="tStaff"]'); await pg.wait_for_timeout(150)
        await pg.click('#gOffice'); await pg.wait_for_timeout(150)
        for t in ['tMoney','tResearch','tLog','tRooms']: await pg.click(f'[data-gtab="{t}"]'); await pg.wait_for_timeout(120)
        await pg.screenshot(path='ux_office.png')
        await pg.click('#gView'); await pg.wait_for_timeout(150); await pg.click('[data-v="walls"]'); await pg.wait_for_timeout(150)
        print('walls', await J("S.wallsDown"))
        await J("closeSheet()")
        # build the basics, then the checklist finishes and celebrates
        await J("""(()=>{ S.cash=50000; placeObject({key:'reception',x:7,y:6,o:0,room:0}); placeObject({key:'bench',x:2,y:6,o:0,room:0}); placeObject({key:'bench',x:4,y:6,o:0,room:0});
          const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); };
          mk('gp',0,0,3,2); mk('pharmacy',5,0,8,2); ['receptionist','doctor','pharmacist'].forEach(r=>hire(r,0)); })()""")
        await J("__jam.run(100)"); await pg.click('#bOpen'); await pg.wait_for_timeout(400)
        print('checklist done', await J("!!S.checkDone"))
        # staff move can be undone
        r = await J("""(()=>{ const st=S.staff.find(s=>s.role==='doctor'); const before=st.assigned; S.held={kind:'staff', id:st.id}; finishDrop(st, null, null); const n=UNDO.length; undo(); return [n>0, st.assigned===before]; })()""")
        print('people undo', r)
        # walkout reason
        await J("for(let i=0;i<5;i++) spawnPatient(); __jam.run(50); walkOut(S.patients[0])")
        print('walkout logged', await J("S.log.some(l=>/walked out:/.test(l.text))"))
        await J("celebrate('🎯 Test', 'celebration')"); await pg.wait_for_timeout(500); await pg.screenshot(path='ux_celebrate.png')
        print('errors', errs); await b.close()
asyncio.run(main())
