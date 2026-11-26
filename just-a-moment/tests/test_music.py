import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = 'file://' + os.path.join(HERE, '..', 'index.html')
CHROME = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True); os.chdir(os.path.join(HERE, 'shots'))
from playwright.async_api import async_playwright
HIDE = "setInterval(()=>{for(const id of ['paper','phoneNote']){const p=document.getElementById(id); if(p&&p.style.display==='flex') p.style.display='none';}},100)"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**CHROME, args=['--no-sandbox','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.add_init_script(HIDE); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        J = pg.evaluate
        await pg.goto(GAME); await pg.wait_for_timeout(1500)
        await pg.click('#bSandbox'); await pg.wait_for_timeout(500)
        print('mood before open', await J("AU.mood"), 'tracks', await J("TRACKS.on"))
        await J("""(()=>{ const mk=(t,x0,y0,x1,y1)=>{ T.mode='room'; T.roomType=t; T.drag={x0,y0,x1,y1}; finishRoomDrag(); const r=S.rooms[S.rooms.length-1]; const d=doorOptions(r); placeDoor(d.find(q=>q.oy>q.y)||d[0]); autoFurnish(r); T.roomId=r.id; finishFurnish(); };
          mk('gp',0,0,3,2); mk('pharmacy',6,0,8,2); placeObject({key:'reception',x:7,y:7,o:0,room:0}); ['receptionist','doctor','pharmacist'].forEach(r=>hire(r,0)); __jam.run(100); })()""")
        await pg.click('#bOpen'); await pg.wait_for_timeout(300)
        print('mood open', await J("AU.mood"))
        await J("for(let i=0;i<14;i++) spawnPatient(); __jam.run(200)"); await pg.wait_for_timeout(300)
        print('mood busy', await J("AU.mood"), 'queue', await J("allPoints().map(p=>p.queue.length).join(',')"))
        await J("sting('vip'); sting('fire'); sting('awards')"); await pg.wait_for_timeout(100)
        print('ducked', await J("AU.duckUntil > AU.ctx.currentTime"))
        await J("document.getElementById('bMenu').click()"); await pg.wait_for_timeout(200)
        await J("const el=document.querySelector('[data-vol=music]'); el.value=20; el.oninput()"); 
        print('volume', await J("AU.vol.music"), 'saved', await J("localStorage.getItem('just-a-moment-volume')"))
        await pg.screenshot(path='music_menu.png')
        print('errors', errs); await b.close()
asyncio.run(main())
