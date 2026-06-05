/* ============== NEOMAP SAVED / VIEWINGS / MESSAGES ============== */

const SAVED_SEARCHES = [
  { id: 1, mode: 'rent', name: 'Эхний орон сууц', districts: ['Хан-Уул'], rooms: [2,3], priceRange: [1200000, 2000000], newMatches: 4, alertFreq: 'daily', sms: true, email: true, push: true, lastAlert: 'Өчигдөр' },
  { id: 2, mode: 'rent', name: 'Сүхбаатарын төв', districts: ['Сүхбаатар','Чингэлтэй'], rooms: [1,2], priceRange: [800000, 1500000], newMatches: 2, alertFreq: 'instant', sms: true, email: false, push: true, lastAlert: '2 цагийн өмнө' },
  { id: 3, mode: 'sale', name: 'Гэр бүлд тохирох сууц', districts: ['Хан-Уул','Сүхбаатар'], rooms: [3,4], priceRange: [350000000, 550000000], newMatches: 7, alertFreq: 'weekly', sms: false, email: true, push: true, lastAlert: '3 хоногийн өмнө' },
  { id: 4, mode: 'sale', name: 'Premium хаус', districts: ['Хан-Уул'], rooms: [4], priceRange: [800000000, 1500000000], newMatches: 0, alertFreq: 'weekly', sms: false, email: true, push: false, lastAlert: 'Шинэ зар алга' }
];

/* User's saved listings — multiple named lists */
const SAVED_LISTS = [
  { id: 1, name: 'Эхний орон сууц', icon: 'heart', listingIds: [1, 2, 5, 6, 7, 8] },
  { id: 2, name: 'Гэр бүлд тохирох', icon: 'home', listingIds: [3, 4, 11, 12] },
  { id: 3, name: 'Хан-Уул зорилт', icon: 'map-pin', listingIds: [9, 12, 15] }
];

/* User has favorited these (default heart-filled set) */
const SAVED_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15]);

/* Scheduled viewings — relative to today so labels stay accurate */
const VIEWINGS = (() => {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  return [
    { id: 1, listingId: 1,  date: iso(1), time: '16:00', status: 'confirmed', dayLabel: 'Маргааш',  countdown: '1 хоног', note: 'Гэр бүлийн хамт' },
    { id: 2, listingId: 11, date: iso(2), time: '14:00', status: 'confirmed', dayLabel: 'Нөгөөдөр', countdown: '2 хоног' },
    { id: 3, listingId: 4,  date: iso(3), time: '11:00', status: 'pending',   dayLabel: '3 хоног',  countdown: '3 хоног', note: 'Хүлээгдэж буй' }
  ];
})();

/* Past viewings — relative to today */
const PAST_VIEWINGS = (() => {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  return [
    { id: 10, listingId: 5, date: iso(15), time: '15:00', status: 'completed', outcome: 'Сонирхолгүй' },
    { id: 11, listingId: 7, date: iso(19), time: '17:00', status: 'completed', outcome: 'Хүлээгдэж буй шийдэл' }
  ];
})();

/* Messages with agents */
const MESSAGES = [
  { id: 1, agentId: 1, lastMsg: 'Тийм, маргааш 16:00-д уулзах боломжтой. Time Tower-ийн ресепшн дээр уулзана уу.', time: '14:32', unread: 1, listingId: 1 },
  { id: 2, agentId: 2, lastMsg: 'Encanto-ийн 2 өрөө байрны нэмэлт зургийг илгээж байна.', time: '11:15', unread: 2, listingId: 2 },
  { id: 3, agentId: 3, lastMsg: 'Energy Residence-ын дотоод дэд бүтцийн талаар хариу өгье.', time: 'Өчигдөр', unread: 0, listingId: 3 },
  { id: 4, agentId: 5, lastMsg: 'Sky Tower-ийн зээлийн нөхцөл талаар банкны зөвлөгөө хүсэх үү?', time: '2 хоног', unread: 0, listingId: 5 },
  { id: 5, agentId: 4, lastMsg: 'Үзэлт амжилттай байсан уу? Бусад тохирох зар санал болгож болох уу?', time: '3 хоног', unread: 0, listingId: 6 }
];

/* Helpers */
const STATUS_PILL = {
  new: ['pill-new', 'Шинэ'],
  drop: ['pill-drop', 'Үнэ буурсан'],
  hot: ['pill-hot', 'Эрэлттэй'],
  active: ['', ''],
  reserved: ['pill-reserved', 'Захиалагдсан'],
  sold: ['pill-sold', 'Зарагдсан']
};
