import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = 'file://' + os.path.join(HERE, '..', 'index.html')
CHROME = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True); os.chdir(os.path.join(HERE, 'shots'))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**CHROME, args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.add_init_script("setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)");
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(700)
        await J("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.fill('#nameIn', 'Mouse General'); await pg.click('[data-lv="0"]'); await pg.wait_for_timeout(300)
        sc = lambda x, y: J(f"__jam.screen({x},{y})")
        print('tut', await J("S.tut"), 'checklist', await J("document.getElementById('goalCard').textContent.includes('Getting started')"))
        # reception desk via Items
        await pg.evaluate("document.getElementById('tFurn').click()"); await pg.click('[data-item=reception]')
        pos = await sc(S_x:=2.5, 7.5) if False else await sc(2.5, 7.5)
        await pg.mouse.move(pos['x'], pos['y']); await pg.wait_for_timeout(50); await pg.mouse.click(pos['x'], pos['y'])
        print('desk', await J("S.objs.map(o=>o.key+'@'+o.x+','+o.y)"), 'tut', await J("S.tut"))
        await pg.keyboard.press('Escape')
        # GP office by dragging
        await pg.evaluate("document.getElementById('tBuild').click()"); await pg.click('[data-room=gp]')
        a = await sc(0.5, 0.5); c = await sc(3.5, 2.5)
        await pg.mouse.move(a['x'], a['y']); await pg.mouse.down(); await pg.mouse.move((a['x']+c['x'])/2, (a['y']+c['y'])/2, steps=5); await pg.mouse.move(c['x'], c['y'], steps=5); await pg.mouse.up()
        print('rooms', await J("S.rooms.map(r=>r.type+' '+r.w+'x'+r.h+' '+r.state)"), 'mode', await J("T.mode"))
        # door: hover a dot below the room then click
        d = await sc(2.5, 3.5); await pg.mouse.move(d['x'], d['y']); await pg.wait_for_timeout(50); await pg.mouse.click(d['x'], d['y'])
        print('door', await J("JSON.stringify(S.rooms[0].door)"), 'mode', await J("T.mode"))
        await pg.click('#buildbar [data-obj="gp-desk"]')
        e = await sc(1.5, 1.5); await pg.mouse.move(e['x'], e['y']); await pg.wait_for_timeout(50)
        print('ghost err', await J("T.ghostErr"))
        await pg.mouse.click(e['x'], e['y']); await pg.wait_for_timeout(50)
        await pg.click('#buildbar [data-done]'); print('gp', await J("S.rooms[0].state"), 'tut', await J("S.tut"))
        await pg.screenshot(path='v2_mouse.png')
        # hire via the panel
        await pg.evaluate("document.getElementById('tHire').click()")
        for role in ['receptionist', 'doctor']:
            await pg.click(f'[data-tab={role}]'); await pg.click('[data-hire="0"]')
        await pg.click('[data-close]')
        print('staff', await J("S.staff.map(s=>s.role+':'+s.assigned)"))
        await J("__jam.run(150)")
        await pg.click('#bOpen'); await J("__jam.run(600)")
        # grab a waiting patient and drop them somewhere
        pid = await J("(S.patients.find(p=>p.st==='wait')||{}).id")
        print('waiting patient', pid)
        if pid:
            await J(f"pickUp('patient', {pid})")
            t = await sc(8.5, 6.5); await pg.mouse.move(t['x'], t['y']); await pg.mouse.click(t['x'], t['y'])
            print('after drop', await J(f"(p=>p&&[p.st,Math.round(p.pos.x),Math.round(p.pos.y)])(S.patients.find(p=>p.id==={pid}))"), 'held', await J("S.held"))
        # grab the doctor and drop them in the corridor: they should walk back
        did = await J("S.staff.find(s=>s.role==='doctor').id")
        await J(f"pickUp('staff', {did})"); t = await sc(9.5, 8.5); await pg.mouse.click(t['x'], t['y'])
        await J("__jam.run(80)"); print('doctor', await J(f"(s=>s.mode+' '+s.assigned)(S.staff.find(s=>s.id==={did}))"))
        # save mid-shift and reload
        await J("save()"); t0 = await J("S.time")
        await pg.reload(); await pg.wait_for_timeout(500)
        print('continue', await pg.text_content('#bCont'))
        await pg.click('#bCont'); await pg.wait_for_timeout(200)
        print('restored phase', await J("S.phase"), 'time', round(await J("S.time")), 'was', round(t0), 'patients', await J("S.patients.length"))
        await J("for(let i=0;i<40&&S.phase==='open';i++){ if(S.dilemmaOpen) chooseDilemma('b'); __jam.run(100);}")
        print('end', await J("S.phase"), await J("S.cures"))
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
