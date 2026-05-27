import { readFileSync } from 'fs'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=')
  if (k?.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim()
}

neonConfig.webSocketConstructor = ws
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const PACKAGES = [
  {
    id: 'munnar-tea-valley-retreat',
    destination: 'Munnar',
    badge: 'Hill Station',
    badgeColor: '#2e9e7a',
    category: 'group',
    duration: '4 Days & 3 Nights',
    title: 'Munnar Tea Valley Retreat',
    subtitle: 'Mist, Tea & Mountain Trails',
    hotels: '2N Tea Estate Resort · 1N Munnar Town',
    originalPrice: 16500,
    salePrice: 12999,
    priceNote: 'Per Person',
    image: 'https://images.unsplash.com/photo-1585394365777-e81a5f5bf68a?w=700&q=80',
    heroImage: 'https://images.unsplash.com/photo-1585394365777-e81a5f5bf68a?w=1400&q=85',
    overview: 'Munnar is Kerala\'s crown jewel — a high-altitude paradise blanketed in rolling tea gardens, cascading waterfalls, and cool misty mornings. This 4-day retreat takes you deep into the Western Ghats, through emerald tea estates, the peak of South India\'s highest trekking trails, and the tranquil banks of the Mattupetty Dam. Perfect for nature lovers, couples, and small groups looking to escape the heat and breathe in pure mountain air.',
    highlights: ['Private guided tour of KDHP tea estate with tasting session','Sunrise trek to Top Station (1700m) — panoramic views of the Western Ghats','Mattupetty Dam speedboat ride & Echo Point visit','Eravikulam National Park — home to the endangered Nilgiri Tahr','Attukad & Valara Waterfalls walk','Night stay in a plantation bungalow surrounded by tea gardens'],
    inclusions: ['3 nights accommodation (tea estate resort + town hotel)','Daily breakfast and dinner','Airport / railway pickup and drop (Kochi or Coimbatore)','Private AC vehicle for all sightseeing','Tea estate guided tour & tasting','Eravikulam National Park entry fees','Experienced local guide throughout'],
    exclusions: ['Flights / trains to Kochi or Coimbatore','Lunch on any day','Personal expenses and tips','Adventure activities (optional trekking permits)','Any entry fees not mentioned above'],
    itinerary: [
      { day: 1, title: 'Arrival in Kochi → Drive to Munnar', description: 'Picked up from Kochi Airport / Ernakulam Station. Begin the scenic 4-hour drive through the ghats — rubber plantations, spice gardens, and misty hillsides. Arrive at Munnar by afternoon. Check into your tea estate resort. Evening stroll through the estate with a cup of freshly brewed hill tea.', activities: ['Kochi pickup (airport or station)','Scenic drive through Thattekad Bird Sanctuary belt','Cheeyappara Waterfalls photo stop en route','Tea estate resort check-in','Welcome tea & estate walk','Dinner at resort'] },
      { day: 2, title: 'Tea Estates, Eravikulam & Mattupetty', description: 'Early morning guided walk through the KDHP tea estate — learn how leaves are plucked, processed, and brewed. Visit the Tea Museum. Post-lunch, head to Eravikulam National Park to spot the endangered Nilgiri Tahr. End with a serene speedboat ride on Mattupetty Dam.', activities: ['KDHP Tea Estate guided morning tour','Tea plucking & factory process demonstration','Tea Museum visit','Eravikulam National Park (Nilgiri Tahr spotting)','Mattupetty Dam speedboat ride','Echo Point visit'] },
      { day: 3, title: 'Top Station Sunrise Trek & Waterfalls', description: 'Rise before dawn for the drive to Top Station, Munnar\'s highest point at 1700m. Trek to the summit for a breathtaking sunrise over the Western Ghats. Afternoon drive to Attukad Waterfalls. Evening at leisure in Munnar town; check into town hotel.', activities: ['Pre-dawn drive to Top Station base','Sunrise trek to Top Station (1700m)','Panoramic views of the Ghats & Kannan Devan Hills','Breakfast at estate','Attukad Waterfalls forest trail','Valara Waterfalls quick visit','Munnar town exploration & spice shopping'] },
      { day: 4, title: 'Rajamala & Departure', description: 'Final morning visit to Rajamala for some of the best mountain scenery in Kerala. After a farewell breakfast, drive back to Kochi or Coimbatore.', activities: ['Rajamala viewpoint & morning walk','Farewell breakfast at hotel','Spice & tea shopping at Munnar market','Drive to Kochi or Coimbatore','Drop at airport / station'] },
    ],
  },
  {
    id: 'alleppey-houseboat-backwaters',
    destination: 'Alleppey',
    badge: 'Backwaters',
    badgeColor: '#e8520a',
    category: 'homestay',
    duration: '3 Days & 2 Nights',
    title: 'Alleppey Houseboat & Backwater Trail',
    subtitle: 'Float Through God\'s Own Waterways',
    hotels: '1N Luxury Houseboat · 1N Lakeside Homestay',
    originalPrice: 14000,
    salePrice: 10999,
    priceNote: 'Per Person (min. 2 persons)',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=700&q=80',
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1400&q=85',
    overview: 'Alleppey — the Venice of the East — is a labyrinth of canals, lakes, and lagoons along Kerala\'s coastline. This 3-day experience starts on a traditional wooden kettuvallam houseboat (with AC bedroom, private sundeck, and onboard cook) gliding through Vembanad Lake. Day two shifts to a lakeside family homestay in Kuttanad, the rice bowl of Kerala, for authentic village immersion.',
    highlights: ['Overnight on a private AC houseboat with sundeck & onboard cook','Vembanad Lake cruise — the longest lake in India','Kuttanad paddy field walk — paddy fields below sea level','Village canoe ride through narrow village canals','Authentic Kerala fish curry cooked fresh on the boat','Sunrise over the backwaters from the houseboat deck','Coir weaving & toddy tapping cultural demonstration'],
    inclusions: ['1 night on a premium AC houseboat (all meals)','1 night in a lakeside family homestay (breakfast & dinner)','All transfers including boat & road','Village canoe ride','Cultural demonstration (coir weaving, coconut processing)','All houseboat meals — breakfast, lunch & dinner','Welcome drink on arrival'],
    exclusions: ['Travel to Alleppey town','Lunch on Day 3','Ayurvedic treatments (optional add-on, ₹1,200/person)','Personal expenses','Boating at Vembanad (optional)'],
    itinerary: [
      { day: 1, title: 'Arrive Alleppey → Houseboat Check-in', description: 'Arrive at Alleppey by midday. Transfer to the jetty and board your private traditional kettuvallam houseboat. Cruise gently through the palm-lined canals of Vembanad Lake. Your cook prepares a spectacular Kerala fish curry lunch. As the sun sets, anchor at a quiet backwater spot.', activities: ['Alleppey jetty pickup & houseboat boarding','Welcome tender coconut drink','Kerala lunch — fish curry, rice, thoran, payasam','Vembanad Lake cruise','Village canal slow cruise','Sunset watching from sundeck','Dinner onboard — Kerala prawn masala'] },
      { day: 2, title: 'Village Immersion in Kuttanad', description: 'Wake up early for a stunning sunrise over Vembanad Lake. After breakfast, disembark at Kuttanad. Walk through paddy fields that lie below sea level. Join a village canoe ride. Afternoon cultural demonstration: coir weaving and toddy tapping. Check into your lakeside family homestay.', activities: ['Backwater sunrise from the houseboat deck','Kerala breakfast — appam & stew','Disembark at Kuttanad jetty','Paddy field walk & rice farming explanation','Village narrow-canal canoe ride','Coir weaving & toddy tapping demo','Homestay check-in & home-cooked dinner'] },
      { day: 3, title: 'Alleppey Beach & Departure', description: 'Final morning at the homestay with a hearty Kerala breakfast. Visit Alleppey Beach and the 150-year-old heritage pier for a short stroll. Transfer to Alleppey railway station.', activities: ['Homestay breakfast — red rice kanji, pickles & chutney','Alleppey Beach morning walk','Heritage pier visit (150-year-old pier)','Local coir product & handicraft shopping','Transfer to railway station / bus stand'] },
    ],
  },
  {
    id: 'wayanad-jungle-homestay',
    destination: 'Wayanad',
    badge: 'Wildlife & Forest',
    badgeColor: '#2e3da8',
    category: 'homestay',
    duration: '3 Days & 2 Nights',
    title: 'Wayanad Jungle Homestay & Wildlife Trail',
    subtitle: 'Tribes, Tigers & Misty Forests',
    hotels: '2N Tribal Jungle Homestay (Lakkidi / Vythiri)',
    originalPrice: 13500,
    salePrice: 9999,
    priceNote: 'Per Person',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=700&q=80',
    heroImage: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1400&q=85',
    overview: 'Wayanad is one of Kerala\'s last great wild places — a dense forest district in the Western Ghats, home to wild elephants, leopards, and tribal communities. This 3-day experience takes you on a Jeep safari through Wayanad Wildlife Sanctuary, to the ancient Edakkal Caves, and to the thundering Soochipara Waterfalls. Stay in a tribally-run jungle homestay where evenings are lit by campfires.',
    highlights: ['Wayanad Wildlife Sanctuary Jeep safari — elephants, deer, langurs','Edakkal Caves — 6,000-year-old Neolithic pictographs','Soochipara (Sentinel Rock) Waterfalls trek','Chembra Peak hike — heart-shaped lake at the summit','Tribal village walk with Kurichiya community','Night jungle walk with naturalist guide','Stay in a tribally-run forest homestay'],
    inclusions: ['2 nights in a forest jungle homestay (all meals)','AC vehicle for all transfers and sightseeing','Wayanad Wildlife Sanctuary Jeep safari with naturalist','Edakkal Caves entry and guided interpretation','Soochipara Waterfalls trek (with guide)','Tribal village cultural walk','All meals: breakfast, lunch and dinner (tribal cuisine)','Night jungle walk with torch & naturalist'],
    exclusions: ['Travel to Calicut (Kozhikode) or Mysore','Chembra Peak trekking permit (₹300/person, optional)','Personal expenses','Alcoholic beverages','Camera fees at wildlife sanctuary'],
    itinerary: [
      { day: 1, title: 'Arrive Wayanad → Tribal Village & Campfire', description: 'Picked up from Kozhikode airport or station. Drive up the spectacular Thamarassery Ghat — 11 hairpin curves through rubber and cardamom estates. Arrive at the jungle homestay. Walk to the nearby Kurichiya tribal village — learn about their bamboo weaving and forest knowledge. Return for a warm campfire dinner of tribal food.', activities: ['Kozhikode pickup & Thamarassery Ghat drive','Jungle homestay check-in & welcome drink','Kurichiya tribal village guided walk','Bamboo craft & traditional music demonstration','Campfire dinner — tribal recipes','Night sky gazing'] },
      { day: 2, title: 'Wildlife Safari & Edakkal Caves', description: 'Rise at 5:30 AM for the golden-hour Jeep safari into Wayanad Wildlife Sanctuary — part of the Nilgiri Biosphere Reserve. Your naturalist guides you through teak forests where elephant herds and spotted deer are regularly spotted. Afternoon drive to the mysterious Edakkal Caves with pictographs dating back 6,000 years. Evening night jungle walk.', activities: ['Pre-dawn wildlife Jeep safari (5:30 AM)','Elephant herd & deer sightings','Naturalist-guided forest walk','Breakfast at homestay','Edakkal Caves hike & Neolithic rock art','Ambukuthi Mala viewpoint','Night jungle walk with naturalist'] },
      { day: 3, title: 'Soochipara Falls Trek & Departure', description: 'After a hearty homestay breakfast, drive to Soochipara (Sentinel Rock) Waterfalls — a 3-tiered 200-foot cascade plunging into a crystal pool. A 30-minute trek through dense foliage leads to the base where you can swim. Return for lunch then drive back to Kozhikode.', activities: ['Homestay breakfast','Soochipara Waterfalls forest trek (30 min)','Swimming at the waterfall pool','Optional: Chembra Peak trek (6 hrs, extra permit)','Farewell lunch at homestay','Drive to Kozhikode — drop at airport / station'] },
    ],
  },
]

async function run() {
  console.log('🔄 Ensuring packages table has required columns...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY, data JSONB NOT NULL,
      category TEXT NOT NULL DEFAULT 'group',
      status TEXT NOT NULL DEFAULT 'approved',
      agency_id INT, featured BOOLEAN NOT NULL DEFAULT false,
      featured_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'group'`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS agency_id INT`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS featured_order INT NOT NULL DEFAULT 0`)

  console.log('🗑️  Deleting all existing packages...')
  const { rowCount } = await pool.query('DELETE FROM packages')
  console.log(`   Removed ${rowCount} packages.`)

  console.log('📦 Inserting 3 new Kerala packages...')
  for (const pkg of PACKAGES) {
    await pool.query(
      `INSERT INTO packages (id, data, category, status) VALUES ($1, $2, $3, 'approved')`,
      [pkg.id, JSON.stringify(pkg), pkg.category]
    )
    console.log(`   ✅ ${pkg.title}`)
  }

  const { rows } = await pool.query('SELECT id, data->>\'title\' AS title, category, status FROM packages')
  console.log('\n📋 Current packages in DB:')
  rows.forEach(r => console.log(`   ${r.id} | ${r.title} | ${r.category} | ${r.status}`))

  await pool.end()
  console.log('\n✅ Done!')
}

run().catch(err => { console.error('❌', err.message); process.exit(1) })
