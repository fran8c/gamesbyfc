import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = 'file://' + os.path.join(HERE, '..', 'index.html')
CHROME = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True); os.chdir(os.path.join(HERE, 'shots'))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**CHROME, args=['--no-sandbox','--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width':860,'height':400}, device_scale_factor=2, has_touch=True, is_mobile=True)
        await ctx.add_init_script("setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)")
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(700)
        await J("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.tap('[data-lv="0"]'); await pg.wait_for_timeout(300); await J('fitCamera()')
        await J("placeObject({key:'reception',x:2,y:7,o:0,room:0}); T.mode='room'; T.roomType='gp'; T.drag={x0:0,y0:0,x1:3,y1:2}; finishRoomDrag(); placeDoor(doorOptions(S.rooms[0]).find(d=>d.oy===3)); autoFurnish(S.rooms[0]); finishFurnish()")
        await pg.wait_for_timeout(300); await pg.screenshot(path='v2_phone.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
