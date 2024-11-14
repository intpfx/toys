/// <reference lib="dom" />

const worker_server_url = (() => {
  const worker_server_context = () => {
    const html = /*html*/`
      <!DOCTYPE html>
      <html lang="zh">
        <head>
          <meta charset="UTF-8" />
        </head>
        <body></body>
        <script type="module" src="main.js"></script>
      </html>`;

    const main = () => {
      const js = async () => {
        const polyCraw = async () => {
          const response = await fetch('/polyCraw');
          const data = await response.json();
          const ul = document.createElement('ul');
          for (const item of data) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = item.headLine;
            a.href = item.href;
            li.appendChild(a);
            ul.appendChild(li);
          }
          document.body.appendChild(ul);
        };
        const dailyHot = async () => {
          const response = await fetch('/dailyHot');
          const data = await response.json();
          const ul = document.createElement('ul');
          for (const item of data) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = item.title;
            a.href = item.url;
            li.appendChild(a);
            ul.appendChild(li);
          }
          document.body.appendChild(ul);
        };
        const weibo = async () => {
          const response = await fetch('/weibo');
          const data = await response.json();
          const ul = document.createElement('ul');
          for (const item of data) {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          }
          document.body.appendChild(ul);
        };
        const zhihu = async () => {
          const response = await fetch('/zhihu');
          const data = await response.json();
          const ul = document.createElement('ul');
          for (const item of data) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = item.title;
            a.href = item.url;
            li.appendChild(a);
            ul.appendChild(li);
          }
          document.body.appendChild(ul);
        };
        const decryptWechatDatfile = async () => {
          const result = await fetch('/decryptWechatDatfile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetPath: '' }),
          });
          const { success, number = 0, error = null } = await result.json();
          const p = document.createElement('p');
          p.textContent = success ? `成功解密${number}个文件` : `解密失败: ${error}`;
          document.body.appendChild(p);
        };
        const findRepeatFiles = async () => {
          const h2 = document.createElement('h2');
          h2.textContent = '正在查找重复文件...';
          document.body.appendChild(h2);
          const ul = document.createElement('ul');
          document.body.appendChild(ul);
          const response = await fetch('/findRepeatFiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '' }),
          });

          if (!response.body) {
            throw new Error('Response body is null');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              h2.textContent = '查找重复文件完成';
              break;
            };
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";
            for (const part of parts) {
              try {
                while (ul.firstChild) {
                  ul.removeChild(ul.firstChild);
                }
                const logs = JSON.parse(part.replace("data: ", ""));
                for (const log of logs) {
                  const li = document.createElement('li');
                  li.textContent = log;
                  ul.appendChild(li);
                }
              } catch (error) {
                console.error('Error parsing log part:', error);
              }
            }
          }
        };
        const proxy = async () => {
          await fetch('/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host: 'baidu.com', port: 80 }),
          });
          document.body.innerHTML = "<h1>3s后移动到代理页面</h1>";
          setTimeout(() => {
            location.href = 'http://localhost:80/';
          }, 3000);
        };
        await proxy();
      };
      const context = js.toString();
      const content = context.slice(context.indexOf('{') + 1, context.lastIndexOf('}'));
      return content;
    };

    async function polyCraw() {
      const { DOMParser } = await import("jsr:@b-fuze/deno-dom");
      const html = await (await fetch('https://tophub.today/')).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const lists = doc.querySelectorAll('.cc-cd');

      const results = [];

      for (const list of lists) {
        const title = list.querySelector('.cc-cd-lb')?.textContent;
        const content = list.querySelector('.cc-cd-cb-l.nano-content');
        const links = content?.querySelectorAll('a');
        if (!links) continue;

        for (const link of links) {
          const headLine = link.querySelector('.t, .tt')?.textContent;
          const href = link.getAttribute('href');
          results.push({ title, headLine, href });
        }
      }

      return results;
    };

    async function crawDailyHot() {
      const output = [];
      const json = await (await fetch('https://tophub.today/do', {
        method: 'POST',
        body: new URLSearchParams({ c: 'hot', t: 'daily' }),
      })).json();
      const { data, _error, _status } = json;
      for (const item of data) {
        output.push({ title: item.title, url: item.url });
      }
      return output;
    };

    async function crawlingWeibo() {
      const output = [];
      const { data } = await (await fetch('https://weibo.com/ajax/side/hotSearch')).json();
      const { realtime } = data;
      for (const item of realtime) {
        output.push(item.word);
      }
      return output;
    };

    async function crawlingZhihu() {
      const output = [];
      const json = await (await fetch('https://www.zhihu.com/api/v4/creators/rank/hot?domain=0&period=hour')).json();
      const { data, _paging } = json;
      for (const item of data) {
        const { question, _reaction } = item;
        output.push({ title: question.title, url: question.url });
      }
      return output;
    };

    async function getComic() {
      interface Picture {
        pid: string;
        width: number;
        height: number;
        url: string;
      }
      interface Comic {
        comic: {
          id: number;
          title: string;
          collect: string;
          isJapanComic: boolean;
          isLightNovel: boolean;
          isLightComic: boolean;
          isFinish: boolean;
          isRoastable: boolean;
          eId: string;
        },
        chapter: {
          cid: number;
          cTitle: string;
          vipStatus: number;
          v_club_status: number;
          is_app_chapter: number;
          online_time: number;
          cSeq: string;
          prevCid: number;
          nextCid: number;
          blankFirst: number;
          canRead: boolean;
        },
        picture: Picture[],
        ads: {
          top: {
            url: string;
            pic: string;
            title: string;
          },
          bottom: {
            url: string;
            pic: string;
            title: string;
          }
        },
        artist: {
          avatar: string;
          nick: string;
          uinCrypt: string;
        }
      }

      /** 漫画数据获取函数 */
      async function getData(url: string | URL | Request) {
        while (true) {
          try {
            const response = await (await fetch(url)).text();
            // 在response字符串中找到'var DATA = '的位置
            const dataStart = response.indexOf('var DATA = ') + 'var DATA = '.length;
            // dataEnd为距离dataStart最近的'的位置
            const dataEnd = response.indexOf(',', dataStart);
            // 截取DATA字符串
            const data = response.slice(dataStart, dataEnd).slice(1, -1);
            const fakeNonceStart = response.indexOf('window["');
            const nonceStart = response.indexOf('window["', fakeNonceStart + 1);
            const nonceEnd = response.indexOf(';', nonceStart);
            const nonceJs = response.slice(nonceStart, nonceEnd).split('=')[1];
            const nonce: string = eval(nonceJs);

            const dataArray = Array.from(data);
            const N = nonce.match(/\d+[a-zA-Z]+/g) as string[];
            let jlen = N.length;
            while (jlen) {
              jlen -= 1;
              const jlocate = parseInt(N[jlen].match(/\d+/)![0]) & 255;
              const jstr = N[jlen].replace(/\d+/g, '');
              dataArray.splice(jlocate, jstr.length);
            }
            const dataString = dataArray.join('');
            const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            const a: number[] = [];
            let e = 0;
            while (e < dataString.length) {
              let b = keyStr.indexOf(dataString[e]);
              e += 1;
              let d = keyStr.indexOf(dataString[e]);
              e += 1;
              const f = keyStr.indexOf(dataString[e]);
              e += 1;
              const g = keyStr.indexOf(dataString[e]);
              e += 1;
              b = b << 2 | d >> 4;
              d = (d & 15) << 4 | f >> 2;
              const h = (f & 3) << 6 | g;
              a.push(b);
              if (64 != f) {
                a.push(d);
              }
              if (64 != g) {
                a.push(h);
              }
            }
            const _v: Comic = JSON.parse(String.fromCharCode.apply(null, a));
            return _v;
          } catch (error) {
            console.log('请求失败，重新请求', error);
            continue;
          }
        }
      }
      /** 漫画数据解析函数 */
      async function parseData(data: Comic) {
        let i = 0;
        const title = data['comic']['title'];
        const chapter = data['chapter']['cTitle'];
        const pictures = data['picture'];
        for (const picture of pictures) {
          i += 1;
          const url = picture['url'];
          const name = `${title}-${chapter}-${i}.jpg`;
          const response = await (await fetch(url)).bytes();
          // 将图片数据写入文件
          Deno.writeFileSync(name, response);
        }
        console.log(`《${title}》-[${chapter}]下载完成，共下载${i}张图片`);
      }
      /** 排行榜数据获取函数 */
      async function popularList(popularity: string = '1') {
        for (let popularity_i = 1; popularity_i <= parseInt(popularity); popularity_i++) {
          const url = `https://ac.qq.com/Comic/all/page/${popularity_i}`;
          const response = await (await fetch(url)).text();
          const comicLists = response.match(/<a href="\/Comic\/comicInfo\/id\/(.*?)".*?title="(.*?)".*?<\/a>/g);
          if (!comicLists) {
            console.log('没有找到漫画列表');
            return;
          }
          for (const comicList of comicLists) {
            const comicID = comicList.match(/\/id\/(.*?)"/);
            const comicTitle = comicList.match(/title="(.*?)"/);
            console.log(`漫画编号:${comicID![1]} 漫画名称:${comicTitle![1]}`);
          }
        }
      }
      /** 漫画下载函数 */
      async function downloadComic() {
        const comicID = prompt('请输入需要下载的漫画编号:');
        const chapterID = prompt('请输入需要下载的章节编号:');
        console.log('-------------------');
        const comicURL = `https://ac.qq.com/ComicView/index/id/${comicID}/cid/${chapterID}`;
        const response = await (await fetch(comicURL)).text();
        const title = response.match(/<title>(.*?)<\/title>/)![1];
        const comicTitle = title.match(/《(.*?)》/)![1];
        const chapterTitle = title.match(/》(.*?)-/)![1];
        const input = prompt(`是否下载${comicTitle}-[${chapterTitle}]?(y/n)`);
        while (true) {
          switch (input) {
            case 'y': {
              const data = await getData(comicURL);
              await parseData(data);
              break;
            }
            case 'n': {
              console.log('已取消下载');
              break;
            }
            default: {
              console.log('请输入正确的选项!(y/n)');
              continue;
            }
          }
          break;
        }
      }

      let flag = true;
      while (flag) {
        const input = prompt('是否需要查询腾讯动漫的热门人气排行榜？(y/n)');
        switch (input) {
          case 'y': {
            const popularity = prompt('请输入需要查询的页数:') || '1';
            console.log('-------------------');
            console.log('腾讯动漫热门人气排行榜');
            console.log('-------------------');
            await popularList(popularity);
            console.log('-------------------');
            await downloadComic();
            break;
          }
          case 'n': {
            await downloadComic();
            break;
          }
          case 'q': {
            console.log('退出程序');
            flag = false;
            break;
          }
          default: {
            console.log('请输入正确的选项!(y/n)');
            continue;
          }
        }
      }
    }

    async function nn() {
      const RBush = (await import('npm:rbush@3.0.1/index.js')).default;
      // 随机生成经纬度坐标
      function randomGeolocation() {
        const x = Math.random() * 360 - 180;
        const y = Math.random() * 180 - 90;
        return [x, y];
      }
      function getDistance(point1: number[], point2: number[]) {
        const [x1, y1] = point1;
        const [x2, y2] = point2;
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
      }
      function findNearestPoint(point: number[], points: number[][]) {
        let minDistance = Infinity;
        let nearestPoint = null;
        for (let i = 0; i < points.length; i++) {
          const distance = getDistance(point, points[i]);
          // const distance = haversineDistance(point[1], point[0], points[i][1], points[i][0]);
          if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = points[i];
          }
        }
        return nearestPoint;
      }
      function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }
      function findNearest(lat: number, lon: number) {
        let result = null;
        // Define a bounding box that covers a reasonable search area
        const continueFind = (r: number) => {
          const bbox = {
            minX: lon - r,
            minY: lat - r,
            maxX: lon + r,
            maxY: lat + r,
          };
          // Search for points within the bounding box
          const candidates = tree.search(bbox);
          if (candidates.length === 0) {
            r++;
            continueFind(r);
          } else {
            // Find the nearest point from the candidates using Haversine distance
            let nearest = candidates[0];
            let minDistance = haversineDistance(lat, lon, nearest.lat, nearest.lon);
            for (const candidate of candidates) {
              const distance = haversineDistance(lat, lon, candidate.lat, candidate.lon);
              if (distance < minDistance) {
                minDistance = distance;
                nearest = candidate;
              }
            }
            result = [nearest.lon, nearest.lat];
          }
        };
        continueFind(1);
        return result;
      }
      function createPointItem(point: number[]) {
        return {
          minX: point[0],
          minY: point[1],
          maxX: point[0],
          maxY: point[1],
          lat: point[1],
          lon: point[0],
          data: null
        };
      }
      async function drawOutput(points: number[][], point: number[], nearestPoint: number[] | null, outputFileName: string) {
        const { createCanvas } = await import("https://deno.land/x/canvas@v1.4.1/mod.ts");
        const canvas = createCanvas(400, 200);
        const ctx = canvas.getContext("2d");
        // 画出白色背景
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 400, 200);
        // 画出随机生成的坐标点 黑色
        ctx.fillStyle = "black";
        for (const [x, y] of points) {
          ctx.fillRect((x + 180), (y + 90), 4, 4);
        }
        ctx.fillStyle = "red";
        ctx.fillRect((point[0] + 180), (point[1] + 90), 4, 4);
        ctx.fillStyle = "green";
        ctx.fillRect((nearestPoint![0] + 180), (nearestPoint![1] + 90), 4, 4);
        Deno.writeFileSync(`${outputFileName}.png`, canvas.toBuffer());
        console.log(`${outputFileName}.png done!`);
      }
      function linearSearch(points: number[][], point: number[]) {
        const startTimestamp = Date.now();
        const nearestPoint = findNearestPoint(point, points);
        const endTimestamp = Date.now();
        console.log('L 查询耗时:', endTimestamp - startTimestamp);
        console.log('随机坐标点:', point);
        console.log('最近的坐标点:', nearestPoint);
        drawOutput(points, point, nearestPoint, 'output0');
      }
      function RSearch(points: number[][], point: number[]) {
        const startTimestamp = Date.now();
        const nearestPoint = findNearest(point[1], point[0]);
        const endTimestamp = Date.now();
        console.log('R 查询耗时:', endTimestamp - startTimestamp);
        console.log('随机坐标点:', point);
        console.log('最近的坐标点:', nearestPoint);
        drawOutput(points, point, nearestPoint, 'output1');
      }

      // 生成 9 个随机坐标点
      const points = Array.from({ length: 9 }, () => randomGeolocation());
      // 生成一个随机坐标点
      const pinPoint = randomGeolocation();
      // 找到最近的坐标点
      // 方案一: 简单线性搜索
      linearSearch(points, pinPoint);

      // 方案二: 使用 R 树
      const startTimestamp = Date.now();
      const tree = new RBush();
      for (const point of points) {
        tree.insert(createPointItem(point));
      }
      const endTimestamp = Date.now();
      console.log('初次建立R树耗时:', endTimestamp - startTimestamp);
      RSearch(points, pinPoint);

      setInterval(() => {
        const flag = Math.random() > 0.2 ? true : false;
        const pPoint = randomGeolocation();
        if (flag) {
          // 随机范围在5000 - 10000之间的整数
          const randomNum = Math.floor(Math.random() * 5000 + 5000);
          for (let i = 0; i < randomNum; i++) {
            const point = randomGeolocation();
            tree.insert(createPointItem(point));
            points.push(point);
          }
          console.log('新增坐标点数量:', randomNum);
          console.log('当前坐标点数量:', points.length);
          linearSearch(points, pPoint);
          RSearch(points, pPoint);
        } else {
          // 随机范围在50 - 100之间的整数
          const randomNum = Math.floor(Math.random() * 50 + 50);
          for (let i = 0; i < randomNum; i++) {
            const index = Math.floor(Math.random() * points.length);
            if (points[index]) {
              tree.remove(createPointItem(points[index]), (a: number[], b: number[]) => a === b);
              points.splice(index, 1);
            }
          }
          console.log('删除坐标点数量:', randomNum);
          console.log('当前坐标点数量:', points.length);
          linearSearch(points, pPoint);
          RSearch(points, pPoint);
        }
      }, 1000 * 60);
    }

    /**
     * 
     * @param {string} path 执行路径 默认为当前路径
     */
    async function decryptWechatDatfile(path: string = Deno.cwd()) {
      const jpgHead = 255;
      const files = [];
      try {
        for await (const dirEntry of Deno.readDir(path)) {
          if (dirEntry.isFile && dirEntry.name.endsWith('.dat')) {
            files.push(dirEntry);
          }
        }

        if (files.length === 0) {
          return { success: true, number: 0 };
        }

        // 新建一个文件夹output
        let targetFolderName = 'output';
        while (true) {
          try {
            Deno.mkdirSync(`${path}/output`);
            break;
          } catch (error) {
            // 如果文件夹已经存在 则在文件名后添加随机字符串
            if (error instanceof Deno.errors.AlreadyExists) {
              const randomString = Math.random().toString(36).slice(2, 8);
              Deno.mkdirSync(`${path}/output_${randomString}`);
              targetFolderName = `output_${randomString}`;
              break;
            }
          }
        }

        await Promise.all(files.map(async (file) => {
          const data = await Deno.readFile(`${path}/${file.name}`);
          const transHead = jpgHead ^ data[0];
          const newData = data.map(byte => byte ^ transHead);
          await Deno.writeFile(`${path}/${targetFolderName}/${file.name}.jpg`, newData);
        }));

        return { success: true, number: files.length };
      } catch (error) {
        return { success: false, error: (error as { name: string, code: string }).name };
      }
    };

    function findRepeatFiles(path = Deno.cwd()) {
      return new ReadableStream({
        async start(controller) {
          // 初始化基本量
          const { join } = await import("jsr:@std/path");
          let done: () => void;
          const isDone = new Promise<void>((resolve) => done = resolve);
          const encoder = new TextEncoder();
          const hashMap: Map<string, string> = new Map();
          const output: Map<string, Set<string>> = new Map();
          const backOut: { [key: string]: { sourcePath: string, targetPath: string } } = {};
          const logs: string[] = new Proxy([], {
            set: (target: string[], property: string, newValue: string, receiver) => {
              if (property === 'length') {
                return Reflect.set(target, property, newValue, receiver);
              } else {
                target[Number(property)] = newValue;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(target)}\n\n`));
                return true;
              }
            }
          });
          const dirPath = path;
          const files: string[] = [];
          const isHidden = async (filename: string) => {
            const isWindows = Deno.build.os === "windows";
            if (isWindows) {
              const process = new Deno.Command("attrib",
                {
                  args: [filename],
                  stdout: "piped",
                  stderr: "piped"
                });
              const output = await process.output();
              const decoder = new TextDecoder();
              return decoder
                .decode(output.stdout)
                .replace(filename, "")
                .trim()
                .includes("H");
            } else {
              return filename.startsWith(".");
            }
          };
          const add_file = async (target_path: string) => {
            for await (const dirEntry of Deno.readDir(target_path)) {
              const fullPath = join(target_path, dirEntry.name);

              if (dirEntry.isDirectory) {
                await isHidden(fullPath) ? logs.push(`跳过隐藏文件夹: ${fullPath}`) : await add_file(fullPath);
              } else {
                files.push(fullPath);
              }
            }
          };
          await add_file(dirPath);
          logs.push(`文件总数: ${files.length}`);

          // 初始化进度条
          class ProgressBar {
            total: number;
            completed: number;
            console: boolean;
            constructor(total: number, console: boolean = false) {
              this.total = total;
              this.completed = 0;
              this.console = console;
              this.render(this.completed);
            }

            render(completed: number) {
              const percentage = Math.min(Math.floor((completed / this.total) * 100), 100);
              const bar = "=".repeat(percentage / 2);
              const logIndex = logs.findIndex((log) => log.includes('%'));
              if (logIndex === -1) {
                logs.unshift(`[${bar.padEnd(50)}] ${percentage}%`);
              } else {
                logs[logIndex] = `[${bar.padEnd(50)}] ${percentage}%`;
              }
              if (this.console) logs.map((log) => console.log(log));
            }

            update() {
              this.completed++;
              if (this.console) console.clear();
              this.render(this.completed);
            }
          }
          const progress = new ProgressBar(files.length);

          // 初始化 Worker
          const worker_context_url = (() => {
            const worker_execute = () => {
              // 计算文件的哈希值
              const computeHash = async (filename: string | URL) => {
                try {
                  const fileReader = await Deno.open(filename);
                  const buffer = new Uint8Array(1024);
                  let bytesRead: number | null = 0;
                  let hash = '';
                  while ((bytesRead = await fileReader.read(buffer)) !== null) {
                    const digest = await crypto.subtle.digest("SHA-256", buffer.slice(0, bytesRead));
                    const hashArray = Array.from(new Uint8Array(digest));
                    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
                    hash += hashHex;
                  }
                  fileReader.close();
                  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hash));
                  const hashArray = Array.from(new Uint8Array(digest));
                  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
                  return hashHex;
                } catch (error) {
                  console.error(`Error processing file ${filename}: ${error}`);
                  throw error;
                }
              };

              self.onmessage = async (event) => {
                try {
                  const { filenames } = event.data;
                  let taskCount = filenames.length;
                  if (taskCount === 0) {
                    self.postMessage({ type: 'off', name: self.name, taskCount: filenames.length });
                    return;
                  }
                  for (const filename of filenames) {
                    const hash = await computeHash(filename);
                    self.postMessage({ type: 'on', hash, filename });
                    taskCount--;
                    if (taskCount === 0) {
                      self.postMessage({ type: 'off', name: self.name, taskCount: filenames.length });
                    }
                  }
                } catch (error) {
                  console.error(error);
                  self.postMessage({ type: 'error', message: error });
                }
              };
            };
            const worker_context = worker_execute.toString();
            const worker_content = worker_context.slice(worker_context.indexOf('{') + 1, worker_context.lastIndexOf('}'));
            const worker_blob = new Blob([worker_content], { type: 'application/javascript' });
            return URL.createObjectURL(worker_blob);
          })();
          const cpuCount = navigator.hardwareConcurrency || 1;
          logs.push(`CPU 核心数: ${cpuCount}`);
          const workerCount = Math.min(cpuCount, files.length);
          logs.push(`Worker 数量: ${workerCount}`);
          let doneCount = 0;
          const workers = [];
          for (let i = 0; i < workerCount; i++) {
            const worker = new Worker(worker_context_url, { name: `worker-${i}`, type: "module", deno: { permissions: "inherit" } });
            worker.onmessage = (event) => {
              const { type, ...more } = event.data;
              switch (type) {
                case "on": {
                  const { hash, filename } = more;
                  if (hashMap.has(hash)) {
                    if (output.has(hash)) {
                      output.get(hash)!.add(filename);
                    } else {
                      const hashSet: Set<string> = new Set();
                      hashSet.add(hashMap.get(hash)!);
                      hashSet.add(filename);
                      output.set(hash, hashSet);
                    }
                  } else {
                    hashMap.set(hash, filename);
                  }
                  // 更新进度条
                  progress.update();
                  break;
                }
                case "off": {
                  const { name, taskCount } = more;
                  logs.push(`${name} 已完成 ${taskCount} 个任务`);
                  worker.terminate();
                  doneCount++;
                  if (doneCount === workerCount) {
                    logs.push("所有任务已完成");
                    done();
                  }
                  progress.update();
                  break;
                }
                case "error": {
                  logs.push(`worker-${i} 发生错误: ${more.message}`);
                  break;
                }
              }
            };
            workers.push(worker);
          }

          // 分配任务
          const taskCount = Math.ceil(files.length / workerCount);
          for (let i = 0; i < workerCount; i++) {
            const start = i * taskCount;
            const end = Math.min(start + taskCount, files.length);
            const filenames = files.slice(start, end);
            if (filenames.length > 0) {
              workers[i].postMessage({ filenames });
              logs.push(`分配任务给 worker-${i}, 任务数量: ${filenames.length}`);
            } else {
              workers[i].postMessage({ filenames: [] });
              logs.push(`分配任务给 worker-${i}, 任务数量: 0`);
            }
          }

          await isDone;

          // 判断是否有重复文件
          if (output.size === 0) {
            logs.push("没有重复文件");
          } else {
            const folder = "output";
            const folderPath = join(dirPath, folder);
            Deno.mkdirSync(folderPath, { recursive: true });
            for (const [hash, files] of output) {
              const hashPath = join(folderPath, hash);
              await Deno.mkdir(hashPath, { recursive: true });
              for (const file of files) {
                const targetPath = join(hashPath, file.split('\\').pop()!);
                await Deno.rename(file, targetPath);
                backOut[file] = { sourcePath: file, targetPath };
              }
            }
            // 生成backOut.json文件到output文件夹
            Deno.writeTextFileSync(join(folderPath, 'backOut.json'), JSON.stringify(backOut, null, 2));
            logs.push("重复文件已移动到 output 文件夹");
          }
          progress.update();
          controller.close();
        }
      });
    }

    /**
     * 本地运行时没有TLS证书 选择80端口 如果有证书可以选择443端口
     * @param host 要代理的网站域名
     * @param port 代理服务端口
     */
    function WebProxy(host: string, port: number = 80) {
      /** 复制头部 */
      const copyHeaders = (headers: Headers) => {
        const newHeader = new Headers();
        for (const i of headers.entries()) {
          newHeader.append(...i);
        }
        return newHeader;
      };
      /** 重写请求头部信息 */
      const ReqHeadersRewrite = (req: Request, Url: URL) => {
        const newH = copyHeaders(req.headers);
        newH.delete("X-deno-transparent");
        // 重写 referer 和 origin 保证能够获取到数据
        newH.set("referer", Url.toString());
        newH.set("origin", Url.toString());
        return newH;
      };
      /** 重写响应头部信息 */
      const ResHeadersReWrite = (res: Response, domain: string) => {
        const newHeader = copyHeaders(res.headers);
        newHeader.set("access-control-allow-origin", "*");
        const cookie = newHeader.get("set-cookie");
        cookie && newHeader.set("set-cookie", cookie.replace(/domain=(.+?);/, `domain=${domain};`));
        newHeader.delete("X-Frame-Options"); // 防止不准 iframe 嵌套
        return newHeader;
      };
      /** 代理整个网站，包括所有请求模式 */
      const proxy = async (host: string, req: Request) => {
        const Url = new URL(req.url);
        Url.host = host;
        if (Url instanceof Response) return Url;

        const newH = ReqHeadersRewrite(req, Url);
        const res = await fetch(Url, {
          headers: newH,
          method: req.method,
          body: req.body, // 所有 body 将会转交，故没啥兼容问题
          redirect: req.redirect,
        });

        const newHeader = ResHeadersReWrite(res, new URL(req.url).host);
        const config = {
          status: res.status,
          statusText: res.statusText,
          headers: newHeader,
        };
        console.log(res.status, res.url);
        if (res.status >= 300 && res.status < 400) {
          console.log("重定向至", req.url);
          return Response.redirect(req.url, res.status);
        }
        return new Response(res.body, config);

        // return fetch(Url, {
        //   headers: newH,
        //   method: req.method,
        //   body: req.body, // 所有 body 将会转交，故没啥兼容问题
        //   redirect: req.redirect,
        // }).then((res) => {
        //   const newHeader = ResHeadersReWrite(res, new URL(req.url).host);
        //   const config = {
        //     status: res.status,
        //     statusText: res.statusText,
        //     headers: newHeader,
        //   };
        //   console.log(res.status, res.url);
        //   if (res.status >= 300 && res.status < 400) {
        //     console.log("重定向至", req.url);
        //     return Response.redirect(req.url, res.status);
        //   }
        //   return new Response(res.body, config);
        // });
      };
      // 启动代理服务
      Deno.serve({ port: port }, (req: Request) => {
        try {
          return proxy(host, req);
        } catch (e) {
          return new Response(JSON.stringify({ error: e, code: 100 }), {
            headers: {
              "access-control-allow-origin": "*",
            },
          });
        }
      });
    }

    Deno.serve({ port: 24531 }, async (request) => {
      let isProxy = false;

      if (isProxy) {
        // 将请求转发到代理服务器 端口为 80
        const proxyUrl = new URL(request.url);
        proxyUrl.port = "80";
        const proxyReq = new Request(proxyUrl.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        return fetch(proxyReq);
      }

      const url = new URL(request.url);
      const pathArray = url.pathname.split("/");
      const headers = new Headers();

      switch (pathArray[1]) {
        case "": {
          headers.set("Content-Type", "text/html");
          return new Response(html, { status: 200, headers });
        }
        case "main.js": {
          headers.set("Content-Type", "application/javascript");
          return new Response(main(), { status: 200, headers });
        }
        case "polyCraw": {
          headers.set("Content-Type", "application/json");
          return new Response(JSON.stringify(await polyCraw()), { status: 200, headers });
        }
        case "dailyHot": {
          headers.set("Content-Type", "application/json");
          return new Response(JSON.stringify(await crawDailyHot()), { status: 200, headers });
        }
        case "weibo": {
          headers.set("Content-Type", "application/json");
          return new Response(JSON.stringify(await crawlingWeibo()), { status: 200, headers });
        }
        case "zhihu": {
          headers.set("Content-Type", "application/json");
          return new Response(JSON.stringify(await crawlingZhihu()), { status: 200, headers });
        }
        case "decryptWechatDatfile": {
          const { targetPath } = await request.json();
          const result = targetPath ? await decryptWechatDatfile(targetPath) : await decryptWechatDatfile();
          headers.set("Content-Type", "application/json");
          return new Response(JSON.stringify(result), { status: 200, headers });
        }
        case "findRepeatFiles": {
          const { path } = await request.json();
          const stream = path ? findRepeatFiles(path) : findRepeatFiles();
          headers.set("Content-Type", "text/event-stream");
          return new Response(stream, { status: 200, headers });
        }
        case "proxy": {
          const { host, port } = await request.json();
          WebProxy(host, port);
          isProxy = true;
          headers.set("Content-Type", "application/json");
          return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }
        default: {
          headers.set("Content-Type", "text/html");
          const body = "<h1>404 Not Found</h1>";
          return new Response(body, { status: 404, headers });
        }
      }
    });
  };

  const worker_context = worker_server_context.toString();
  const worker_content = worker_context.slice(worker_context.indexOf('{') + 1, worker_context.lastIndexOf('}'));
  const worker_blob = new Blob([worker_content], { type: 'application/javascript' });

  return URL.createObjectURL(worker_blob);
})();
const worker_webview_url = (() => {
  const worker_webview_context = async () => {
    const { Webview } = await import("jsr:@webview/webview");
    const webview = new Webview(true);
    webview.navigate("http://localhost:24531/");
    webview.run();
    postMessage("close");
  };

  const worker_context = worker_webview_context.toString();
  const worker_content = worker_context.slice(worker_context.indexOf('{') + 1, worker_context.lastIndexOf('}'));
  const worker_blob = new Blob([worker_content], { type: 'application/javascript' });

  return URL.createObjectURL(worker_blob);
})();

const worker_server = new Worker(worker_server_url, { name: `worker-server`, type: "module", deno: { permissions: "inherit" } });
const worker_webview = new Worker(worker_webview_url, { name: `worker-webview`, type: "module", deno: { permissions: "inherit" } });

worker_webview.onmessage = (event) => {
  if (event.data === "close") {
    worker_server.terminate();
    worker_webview.terminate();
  }
};