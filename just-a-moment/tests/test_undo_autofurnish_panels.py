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
        await J("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('[data-lv="0"]'); await pg.wait_for_timeout(300)
        await J("S.tut=null; drawAdvisor()")
        c0 = await J("S.cash")
        # auto-furnish
        await J("placeObject({key:'reception',x:2,y:7,o:0,room:0}); T.mode='room'; T.roomType='gp'; T.drag={x0:0,y0:0,x1:3,y1:2}; finishRoomDrag(); placeDoor(doorOptions(S.rooms[0]).find(d=>d.oy===3))")
        await pg.click('#buildbar [data-auto]'); await pg.click('#buildbar [data-done]')
        print('auto-furnished gp:', await J("S.rooms[0].state"), await J("roomObjs(S.rooms[0]).map(o=>o.key)"))
        # undo the last three actions (desk, room, reception) then check cash
        for i in range(3): await pg.click('#tUndo')
        print('after 3 undos rooms', await J("S.rooms.length"), 'objs', await J("S.objs.length"), 'cash back', await J("S.cash") == c0)
        # confirm on room sell
        await J("T.mode='room'; T.roomType='pharmacy'; T.drag={x0:5,y0:0,x1:7,y1:2}; finishRoomDrag(); placeDoor(doorOptions(S.rooms[0])[0]); autoFurnish(S.rooms[0]); finishFurnish(); openRoomCard(S.rooms[0])")
        await pg.click('[data-sell]'); print('after one click rooms', await J("S.rooms.length"))
        await pg.click('[data-sell]'); print('after two clicks rooms', await J("S.rooms.length"))
        await pg.keyboard.press('Control+z'); print('ctrl+z rooms', await J("S.rooms.length"))
        # build a working clinic quickly and run a busy day with a single GP to trigger advice
        await J("placeObject({key:'reception',x:2,y:7,o:0,room:0}); T.mode='room'; T.roomType='gp'; T.drag={x0:0,y0:0,x1:3,y1:2}; finishRoomDrag(); placeDoor(doorOptions(S.rooms[1]).find(d=>d.oy===3)); autoFurnish(S.rooms[1]); finishFurnish(); ['receptionist','doctor','pharmacist'].forEach(r=>hire(r,0)); __jam.run(150); S.day=4")
        await pg.click('#bOpen'); await J("for(let i=0;i<18;i++){ if(S.dilemmaOpen) chooseDilemma('b'); __jam.run(100);}")
        print('advice:', await J("S.log.filter(l=>l.kind==='advice').map(l=>l.text.slice(0,70)+(l.at?' @':''))"))
        # select the GP room: route arrows, walls down
        await J("openRoomCard(S.rooms[1]); S.wallsDown=true; __jam.cam.z=1.6; centerOn({x:4,y:4})")
        await pg.wait_for_timeout(300); await pg.screenshot(path='v2_arrows.png')
        await pg.evaluate("document.getElementById('tRooms').click()"); await pg.wait_for_timeout(100); print('rooms panel:', (await pg.text_content('#sheet'))[:120])
        await pg.click('[data-tab=patients]'); print('patients panel:', (await pg.text_content('#sheet'))[:90])
        await pg.evaluate("document.getElementById('tLog').click()"); n = await J("document.querySelectorAll('.log p[data-at]').length"); print('clickable messages', n)
        if n: await J("document.querySelector('.log p[data-at]').click()")
        await J("for(let i=0;i<40&&S.phase==='open';i++){ if(S.dilemmaOpen) chooseDilemma('b'); __jam.run(100);}")
        await J("document.getElementById('bNext').click()")
        await pg.evaluate("document.getElementById('tMoney').click()"); await pg.wait_for_timeout(200); await pg.screenshot(path='v2_money.png')
        # settings
        await pg.click('#bMenu'); await pg.click('[data-set=big]'); await pg.click('[data-set=cb]'); await pg.click('[data-set=calm]')
        print('settings', await J("JSON.stringify(SET)"), 'body', await J("document.body.className"))
        await pg.click('[data-close]'); await pg.wait_for_timeout(200); await pg.screenshot(path='v2_big.png')
        await J("SET.big=false;SET.cb=false;SET.calm=false;saveSet()")
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
