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
        await pg.click('[data-lv="0"]'); await pg.wait_for_timeout(300)
        await J("S.tut=null; drawAdvisor()")
        sc = lambda x, y, z=0: J(f"__jam.screen({x},{y},{z})")
        await pg.evaluate("document.getElementById('tFurn').click()"); await pg.click('[data-item=vending]')
        t = await sc(6.5, 5.5); await pg.mouse.move(t['x'], t['y']); await pg.mouse.click(t['x'], t['y'])
        await pg.keyboard.press('Escape')
        print('placed', await J("S.objs.map(o=>o.key+'@'+o.x+','+o.y+' o'+o.o)"), 'cash', await J("S.cash"))
        # click high up on the machine's picture (not its floor tile)
        top = await sc(6.5, 5.5, 30); await pg.mouse.click(top['x'], top['y']); await pg.wait_for_timeout(100)
        print('card:', (await pg.text_content('#sheet'))[:40])
        await pg.click('[data-turn]'); print('after turn', await J("S.objs[0].o"))
        await pg.click('[data-move]'); t = await sc(9.5, 4.5); await pg.mouse.move(t['x'], t['y']); await pg.mouse.click(t['x'], t['y'])
        print('after move', await J("S.objs.map(o=>o.key+'@'+o.x+','+o.y+' o'+o.o)"), 'cash', await J("S.cash"), 'mode', await J("T.mode"))
        top = await sc(9.5, 4.5, 30); await pg.mouse.click(top['x'], top['y']); await pg.wait_for_timeout(100)
        await pg.click('[data-sell]'); print('after sell', await J("S.objs.length"), 'cash', await J("S.cash"))
        # a bench: four turns
        await J("placeObject({key:'bench',x:5,y:5,o:0,room:0})")
        for i in range(4): await J("rotateObject(S.objs[0])"); print('bench turn', await J("S.objs[0].o"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
