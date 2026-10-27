// 東京五天四夜 — 行程初始資料。首次開啟時會複製到瀏覽器儲存空間／雲端。
const item = (start, end, title, location, category, description, tip = '', status = 'planned', mapsQuery = '') => ({
  id: '', start, end, title, location, category, description, tip, status, mapsQuery: mapsQuery || location, done: false
});
const day = (date, weekday, shortTitle, title, subtitle, activities) => ({
  date, weekday, shortTitle, title, subtitle,
  activities: activities.map((activity, index) => ({...activity, id: `${date}-${index + 1}`}))
});

export const seedTrip = {
  title: '東京五天四夜・優雅散步',
  subtitle: '和媽媽一起，慢慢逛東京',
  dates: '2027.01.07 — 01.11',
  hotel: '六本木雷姆飯店 Remm Roppongi',
  hotelAddress: '7-14-4 Roppongi, Minato City, Tokyo',
  arrival: '1/7 12:35 抵達成田機場',
  departure: '1/11 22:10 成田起飛返台',
  generalNote: '記得帶護照、日幣現金、交通卡、充電器與保暖大衣。特別想去的店，可以隨時點「新增行程」加進去。',
  checklist: [
    {id:'task-1', label:'確認護照、機票與航廈資訊', done:false},
    {id:'task-2', label:'確認六本木雷姆飯店訂房資訊', done:false},
    {id:'task-3', label:'保留 Balcony by 6th 訂位資料（1/8 12:00）', done:false},
    {id:'task-4', label:'保留 teamLab Borderless 門票（1/8 15:00）', done:false},
    {id:'task-5', label:'預約高輪それがし午餐（1/10）', done:false},
    {id:'task-6', label:'預約 KINTAN 1/11 11:30 午餐（原定行程）', done:false},
    {id:'task-7', label:'再確認機場快線班次與回程交通', done:false}
  ],
  notices: [
    {title:'1/11 是日本國定假日', body:'成人之日，請確認餐廳的假日營業時間及是否提供平日午餐套餐。', source:'https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html'},
    {title:'櫸坂點燈以當年公告為準', body:'依原定行程保留 1/8 櫸坂點燈與夜景散步；實際是否點燈，請出發前確認 2026–2027 冬季活動公告。', source:'https://www.japan-guide.com/e/e2303.html'},
    {title:'車次與機場時間要再確認', body:'Skyliner 原預估 13:30，請以 2027/1/7 航班實際抵達、入境與官網時刻為準。', source:'https://www.keisei.co.jp/keisei/tetudou/skyliner/us/'},
    {title:'高輪轉車站名提醒', body:'搭淺草線通常是抵達「泉岳寺站」，再步行至 NEWoMan 高輪／高輪 Gateway，不是淺草線直接開到高輪 Gateway 站。', source:'https://www.montakanawa.jp/en/access/'}
  ],
  days: [
    day('2027-01-07','四','抵達・上野','抵達東京，第一站去採購','上野藥妝、飯店入住、丸之內與根室花丸',[
      item('12:35','','抵達成田機場','成田國際機場','transport','出關後準備搭乘京成 Skyliner 前往京成上野站，車程約 41–45 分鐘。','原行程寫 Skyliner 42 號約 13:30；請依航廈、入境時間及官網車次再確認。','check','Narita International Airport'),
      item('14:15','15:00','OS Drug 上野藥妝補貨','OS Drug 上野店','shopping','從京成上野站步行前往 OS Drug，一次買齊旅途必需品。','原規劃提醒：可能只收現金、不提供退稅；付款方式以現場為準。','planned','OS Drug 上野 東京'),
      item('15:00','15:45','前往飯店 Check-in','六本木雷姆飯店','hotel','從上野搭日比谷線至六本木站，入住 Remm Roppongi，先放下行李與戰利品。','飯店鄰近六本木站，出站後注意正確出口。','planned','remm Roppongi'),
      item('16:30','21:00','丸之內逛街與根室花丸','KITTE 丸之內','food','抵達東京車站後，先到 KITTE 5 樓的「迴轉壽司 根室花丸」抽號碼牌，再逛丸之內仲通大衣、精品與設計師品牌，依叫號回餐廳吃晚餐。','推薦留意寒鰤魚、干貝等當季菜色；叫號方式請依店家規定。','planned','根室花丸 KITTE 丸之內')
    ]),
    day('2027-01-08','五','麻布台・藝術','麻布台之丘，時髦藝術日','鬆餅與 teamLab 都已預約，今天放慢腳步',[
      item('10:30','','睡飽再出門','六本木雷姆飯店','transport','從飯店前往麻布台之丘，可步行或搭日比谷線至神谷町站，再沿地下通道前往。','步行時間依實際路線與出口而異。','planned','Azabudai Hills'),
      item('12:00','13:30','Balcony by 6th 午餐','Balcony by 6th 麻布台','food','在麻布台之丘享用午餐，一定要留胃給招牌舒芙蕾鬆餅。','已預約 12:00。請保留訂位憑證。','reserved','Balcony by 6th Azabudai'),
      item('13:30','14:45','麻布台之丘散步','麻布台之丘','shopping','逛商場、綠色空間與建築，想喝咖啡可以看看 % Arabica；慢慢走向 Garden Plaza B。','15:00 有固定門票，務必預留步行及入場時間。','planned','Azabudai Hills Garden Plaza B'),
      item('15:00','18:00','teamLab Borderless','teamLab Borderless 麻布台之丘','experience','欣賞沈浸式數位藝術與互動光影作品，預留約 3 小時體驗。','已預約 15:00。淺色上衣可能更適合拍照；鏡面區域請留意衣著。','reserved','teamLab Borderless Azabudai Hills'),
      item('18:30','','六本木櫸坂點燈與冬夜晚餐','六本木之丘','food','步行回六本木，按照原訂安排前往櫸坂欣賞藍白色燈飾與東京鐵塔夜景，並在周邊享用晚餐。','保留原行程；實際燈飾活動日期請依當年官方公告確認。','check','Roppongi Hills Keyakizaka')
    ]),
    day('2027-01-09','六','代官山・銀座','書店、和牛與南青山','東京最有質感的一天',[
      item('10:30','','前往代官山','代官山站','transport','從六本木搭日比谷線至中目黑，轉東急東橫線前往代官山。','請依當天路線查詢轉乘班次。','planned','Daikanyama Station'),
      item('10:50','12:30','代官山 T-SITE 漫步','代官山蔦屋書店','shopping','走訪代官山蔦屋書店、設計選物與街區，享受悠閒書店時光。','','planned','Daikanyama T-SITE'),
      item('13:00','14:30','俺的燒肉・銀座9丁目','俺的燒肉 銀座9丁目','food','搭車至新橋／銀座，享用黑毛和牛與多部位拼盤午餐。','營業時間、午餐供應與訂位方式請再查。','check','俺の焼肉 銀座9丁目'),
      item('14:30','16:30','銀座步行者天國與購物','銀座中央通','shopping','週六午後走訪銀座中央通、GINZA SIX、UNIQLO 旗艦店。','行人徒步區實施時間與天候限制請以當日公告為準。','planned','Ginza Chuo Dori'),
      item('17:00','20:00','南青山設計師街','南青山・表參道','shopping','逛表參道、南青山建築與日本設計師品牌，欣賞精品街景。','部分精品可能較早打烊，想逛的店請優先。','planned','Minami Aoyama Omotesando')
    ]),
    day('2027-01-10','日','高輪・新地標','NEWoMan 高輪探險','高空花園、風景午餐與自由購物',[
      item('10:00','','出發前往高輪','NEWoMan TAKANAWA','transport','從六本木搭大江戶線至大門站，再轉都營淺草線至泉岳寺站，步行前往高輪 Gateway City。','淺草線停「泉岳寺」，不是直接停 JR「高輪 Gateway」。','planned','NEWoMan Takanawa'),
      item('10:30','12:00','NEWoMan 高輪與 LUFTBAUM','NEWoMan TAKANAWA LUFTBAUM','shopping','走訪新商場及 North 棟 28、29 樓高空植物花園，欣賞城市遠景。','LUFTBAUM 公共區域開放時間與個別店家不同；以官網為準。','planned','LUFTBAUM NEWoMan Takanawa'),
      item('12:00','14:00','高輪それがし 景觀午餐','高輪それがし','food','首選日式料理：高輪それがし（North 棟 28F）。備選為同區 The Public Place 或 GARDEN HOUSE。','午間座位建議預約；餐點、加價海膽鮭魚卵及支付方式以官方最新資訊為準。','check','高輪それがし'),
      item('14:30','','下午自由購物','澀谷或六本木','shopping','依體力選擇去澀谷 Scramble Square，或回六本木、新宿繼續逛街。','若計畫前往 SHIBUYA SKY，需另確認購票。','planned','Shibuya Scramble Square')
    ]),
    day('2027-01-11','一','回程・補貨','最後的東京購物日','KINTAN 牛舌、東京車站與成田機場',[
      item('10:30','','退房並寄放行李','六本木雷姆飯店','hotel','辦理退房，大件行李與購物戰利品先寄放飯店櫃檯。','確認飯店行李寄放政策。','planned','remm Roppongi'),
      item('11:30','13:00','六本木 KINTAN 燒肉午餐','六本木 KINTAN','food','享用熟成牛舌、黑毛和牛與燒肉套餐。','1/11 是日本成人之日國定假日，平日午餐套餐及續點規則不一定適用，務必先確認並預約。','check','Roppongi KINTAN'),
      item('13:30','16:30','東京車站與丸之內最後採購','東京車站・丸之內','shopping','回補服飾與大衣，再去東京車站地下街買東京 Banana、甜點和限定伴手禮。','旅途最後一天，記得控制採購時間與行李重量。','planned','Tokyo Station Character Street'),
      item('17:00','18:00','回飯店取行李','六本木雷姆飯店','transport','返回六本木飯店領取寄放行李，再帶行李前往東京車站。','預留上下班人潮、電梯、搬運大行李的時間。','planned','remm Roppongi'),
      item('18:30','19:30','搭 N’EX 前往成田機場','東京車站 → 成田機場','transport','前往東京車站地下總武線月台搭 JR 成田特快 N’EX，或考慮八重洲側機場巴士。','原規劃約 19:35 抵達機場。務必事先查回程班次、航廈與航空公司最晚報到時間。','check','Narita Express Tokyo Station'),
      item('22:10','','從成田機場起飛返台','成田國際機場','transport','完成報到、托運與安檢，準備返台。','最終航班時間請以機票為準。','planned','Narita International Airport')
    ])
  ]
};
